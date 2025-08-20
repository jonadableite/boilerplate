import type { StandardSchemaV1 } from '@igniter-js/core'

export type ContentLayerEntity<
  TName extends string,
  TSchema extends StandardSchemaV1,
> = {
  name: TName
  schema: TSchema
  path: string // Caminho específico para esta entidade
}

export type ContentLayerSearchPostsParams<
  TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
  TType extends keyof TTypes,
  TEntity extends TTypes[TType] = TTypes[TType],
> = {
  type: TType
  where?: Partial<StandardSchemaV1.InferInput<TEntity['schema']>>
  orderBy?: keyof StandardSchemaV1.InferInput<TEntity['schema']>
  orderDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export type ContentLayerWherePostsParams<
  TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
  TType extends keyof TTypes,
  TEntity extends TTypes[TType] = TTypes[TType],
> = {
  type: TType
  where: Partial<StandardSchemaV1.InferInput<TEntity['schema']>>
}

export type ContentHeading = {
  id: string
  title: string
  path: string
  level: number
  items: ContentHeading[]
}

export type ContentLayerProviderOptions<
  TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
> = {
  schemas: TTypes
}

export type ContentTypeResult<TData = unknown> = {
  id: string
  slug: string
  excerpt: string
  content: string
  data: TData
  headings: ContentHeading[]
}

export interface IContentLayerProvider<
  TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
> {
  listPosts: <TType extends keyof TTypes>(
    params: ContentLayerSearchPostsParams<TTypes, TType>,
  ) => Promise<
    ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>[]
  >
  getPost: <TType extends keyof TTypes>(
    params?: ContentLayerWherePostsParams<TTypes, TType>,
  ) => Promise<ContentTypeResult<
    StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
  > | null>
  getPostBySlug: <TType extends keyof TTypes>(
    type: TType,
    slug: string,
  ) => Promise<ContentTypeResult<
    StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
  > | null>
  listPostsGroupedBy: <TType extends keyof TTypes>(params: {
    type: TType
    field: keyof StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    orderBy?: keyof StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    orderDirection: 'asc' | 'desc'
  }) => Promise<
    Record<
      string,
      ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>[]
    >
  >
}
