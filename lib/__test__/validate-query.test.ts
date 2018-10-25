import { introspectionFromSchema } from "graphql";
import gql from "graphql-tag";
import { validateQueryAndMutation } from "../validate-query";
import { makeExecutableSchema } from "graphql-tools";

const schemaTypeDef = gql`
  scalar Date

  enum LayoutEnumType {
    GRID
    ROW
  }

  type SectionInformation {
    title: String
    id: String
    language: LanguageEnum
  }

  enum LanguageEnum {
    TH
    EN
  }

  type Section {
    id: String
    slug: String
    type: LayoutEnumType
    publishStatus: Date
    informations: [SectionInformation]
  }

  input SectionWhereInputType {
    id: ID
  }
  input InformationCreateOne {
    title: String!
  }

  input SectionCreateInputType {
    slug: String!
    type: LayoutEnumType!
    informations: InformationCreateOne!
  }

  input SectionUpdateInputType {
    slug: String!
    type: LayoutEnumType!
    informations: InformationCreateOne!
  }
  type Query {
    section(skip: Int, first: Int): Section
    information: SectionInformation
    informations: [SectionInformation!]
  }
  type Mutation {
    upsertSection(
      where: SectionWhereInputType!
      update: SectionUpdateInputType!
      create: SectionCreateInputType!
    ): Section
  }
`;
const introspection = introspectionFromSchema(
  makeExecutableSchema({
    typeDefs: schemaTypeDef
  }),
  {
    descriptions: false
  }
);

describe("GraphQLCRUDView test", () => {
  it("should validate Query, Mutation correctly", () => {
    const FRAGMENT = gql`
      fragment SectionData on Section {
        slug @input
        type @input

        informations @relation(type: ONE_TO_MANY, from: "informations") {
          title @column
          id @value
          langauge @column
        }
      }
    `;
    expect(
      validateQueryAndMutation(
        gql`
          ${FRAGMENT}
          query {
            section @CRUD {
              ...SectionData
              publishStatus @input

              nested @CRUD {
                title
              }
            }
          }
          mutation(
            $create: SectionCreateInputType
            $where: SectionWhereInputType
            $update: SectionUpdateInputType
          ) {
            upsertSection(create: $create, where: $where, update: $update)
              @CRUD {
              ...SectionData
            }
          }
        `,
        introspection
      )
    ).toBeTruthy();
    expect(
      validateQueryAndMutation(
        gql`
          ${FRAGMENT}
          query {
            information @CRUD {
              id
            }
          }
          mutation(
            $create: SectionCreateInputType
            $where: SectionWhereInputType
            $update: SectionUpdateInputType
          ) {
            upsertSection(create: $create, where: $where, update: $update)
              @CRUD {
              ...SectionData
            }
          }
        `,
        introspection
      )
    ).toBeFalsy();
  });
});
