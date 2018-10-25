import {
  DocumentNode,
  visit,
  IntrospectionQuery,
  printSchema,
  buildClientSchema,
  parse,
  BREAK,
  OperationDefinitionNode,
  FieldNode,
  ObjectTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  DefinitionNode
} from "graphql";

type FieldDefinitionKind =
  | ObjectTypeDefinitionNode
  | InputObjectTypeDefinitionNode
  | EnumTypeDefinitionNode
  | ScalarTypeDefinitionNode;
function getFieldDefinitionTypeFromFieldPath(
  path: Array<OperationDefinitionNode | FieldNode>,
  query: DocumentNode,
  schema: DocumentNode
) {
  let currentDefititionNode:
    | DocumentNode
    | ObjectTypeDefinitionNode
    | InputObjectTypeDefinitionNode
    | EnumTypeDefinitionNode
    | ScalarTypeDefinitionNode = schema;

  let currentDefinitionNode: FieldDefinitionKind | undefined;
  let currentPath = path[0];
  if (currentPath.kind === "OperationDefinition") {
    if (currentPath.operation === "mutation") {
      currentDefinitionNode = schema.definitions.find(
        (item): item is ObjectTypeDefinitionNode =>
          item.kind === "ObjectTypeDefinition" && item.name.value === "Mutation"
      )!;
    } else if (currentPath.operation === "query") {
      currentDefinitionNode = schema.definitions.find(
        (item): item is ObjectTypeDefinitionNode =>
          item.kind === "ObjectTypeDefinition" && item.name.value === "Query"
      )!;
    }
  }

  path.shift();
  while (path.length) {
    currentPath = path[0];

    if (
      currentDefinitionNode &&
      currentDefinitionNode.kind === "ObjectTypeDefinition" &&
      currentDefinitionNode.fields
    ) {
      const fieldDefinition = currentDefinitionNode.fields.find(n => {
        return (
          currentPath.kind === "Field" &&
          currentPath.name.value === n.name.value
        );
      });
    }
    // throw new Error(`FieldDefinition ${}`)

    currentDefinitionNode = schema.definitions.find(
      definition => {



      }
    )

    path.shift();
  }

  return currentDefititionNode;
}
type NodePath = Array<OperationDefinitionNode | FieldNode>;
export function validateQueryAndMutation(
  query: DocumentNode,
  introspection: IntrospectionQuery
) {
  const clientSchemaAST = parse(printSchema(buildClientSchema(introspection)));
  let validated = true;
  let nodePath: NodePath = [];

  let CRUDNodePath: Array<NodePath> = [];
  visit(query, {
    Document: {
      enter: node => {
        /**
         * Query and Mutation should have only
         * single operation
         */
        if (
          node.definitions.filter(
            selectionNode =>
              selectionNode.kind === "OperationDefinition" &&
              selectionNode.operation === "mutation"
          ).length === 1 &&
          node.definitions.filter(
            selectionNode =>
              selectionNode.kind === "OperationDefinition" &&
              selectionNode.operation === "query"
          ).length === 1
        ) {
          validated = true;
        } else {
          validated = false;
          return BREAK;
        }
      }
    },

    OperationDefinition: {
      enter: node => {
        nodePath.push(node);
      },
      leave: node => {
        nodePath.pop();
      }
    },
    Field: {
      enter: (node, key, parent, path) => {
        nodePath.push(node);
      },
      leave: (node, key, parent, path, ancestor) => {
        nodePath.pop();
      }
    },
    Directive: (node, key, parent, path, ancestor) => {
      if (node.name.value === "CRUD") {
        CRUDNodePath.push(nodePath.map(item => item));

        if (CRUDNodePath.length === 2) {
          console.log("checking...");
          const f = getFieldDefinitionTypeFromFieldPath(
            CRUDNodePath[0],
            query,
            clientSchemaAST
          );
          f;
        }
      }
    }
  });

  return validated;
}
