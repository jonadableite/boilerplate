'server only'

import type {
  ContentHeading,
  ContentLayerEntity,
  ContentLayerProviderOptions,
  ContentLayerSearchPostsParams,
  ContentLayerWherePostsParams,
  ContentTypeResult,
  IContentLayerProvider,
} from './types'
import type { StandardSchemaV1 } from '@igniter-js/core'

import matter from 'gray-matter'
import * as path from 'path'
import { promises as fs } from 'fs'

/**
 * ContentLayerProvider - Uma abstração para trabalhar com conteúdo em markdown
 * Implementa uma API para buscar e listar posts a partir de arquivos markdown
 */
export class ContentLayerProvider<
  TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
> implements IContentLayerProvider<TTypes>
{
  private contentCache: Map<string, ContentTypeResult<any>> = new Map()
  private initialized = false

  constructor(private readonly options: ContentLayerProviderOptions<TTypes>) {}

  /**
   * Inicializa o cache de conteúdo
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return

    for (const [type, entity] of Object.entries(this.options.schemas)) {
      // Usa o caminho específico de cada entidade
      const contentPath = path.join(process.cwd(), entity.path)

      try {
        await this.readContentDirectory(contentPath, type)
      } catch (error) {
        console.warn(`Failed to read content directory for ${type}:`, error)
      }
    }

    this.initialized = true
  }

  /**
   * Lê recursivamente um diretório e processa arquivos markdown
   */
  private async readContentDirectory(
    dirPath: string,
    type: string,
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          await this.readContentDirectory(fullPath, type)
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))
        ) {
          await this.processMarkdownFile(fullPath, type)
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error)
    }
  }

  /**
   * Processa um arquivo markdown e armazena no cache
   */
  private async processMarkdownFile(
    filePath: string,
    type: string,
  ): Promise<void> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)

      // Extrai o slug do caminho do arquivo
      const entity = this.options.schemas[type]
      const entityBasePath = path.join(process.cwd(), entity.path)

      const relativePath = path.relative(entityBasePath, filePath)
      const slug = relativePath
        .replace(/\.mdx?$/, '')
        .replace(/\/index$/, '')
        .replace(/\\/g, '/')

      // Gera ID único
      const id = `${type}:${slug}`

      // Extrai headings para table of contents
      const headings = this.extractHeadings(content)

      // Valida metadados contra o schema
      const schema = entity.schema
      try {
        // @ts-expect-error - O schema é dinâmico e não pode ser inferido corretamente
        const validatedData = schema.parse(frontmatter)

        const result: ContentTypeResult<any> = {
          id,
          slug,
          excerpt: this.extractExcerpt(content),
          content,
          data: validatedData,
          headings,
        }

        this.contentCache.set(id, result)
      } catch (validationError) {
        console.warn(`Validation error in ${filePath}:`, validationError)
      }
    } catch (error) {
      console.error(`Error processing markdown file ${filePath}:`, error)
    }
  }

  /**
   * Extrai um resumo do conteúdo markdown
   */
  private extractExcerpt(content: string, maxLength = 120): string {
    // Remove todos os caracteres markdown e obtém os primeiros caracteres
    const plainText = content
      .replace(/#+\s+/g, '') // Remove headings
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, mantendo o texto
      .replace(/[*_~`]/g, '') // Remove marcadores de formatação
      .replace(/\n+/g, ' ') // Substitui quebras de linha por espaços
      .replace(/<[^>]*>/g, '') // Remove tags HTML
      .trim()

    return plainText.length > maxLength
      ? plainText.substring(0, maxLength).trim() + '...'
      : plainText
  }

  /**
   * Extrai headings do conteúdo markdown para criar um table of contents completo com hierarquia
   * Os headings são organizados em uma estrutura aninhada onde títulos de nível superior
   * contêm subtítulos de nível inferior como itens filhos.
   */
  private extractHeadings(content: string): ContentHeading[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: ContentHeading[] = []

    // Estrutura para rastrear o heading pai atual para cada nível
    // headingsByLevel[1] é o último h1 encontrado, headingsByLevel[2] é o último h2, etc.
    const headingsByLevel: (ContentHeading | null)[] = Array(7).fill(null)

    let match
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const title = match[2].trim()
      const id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')

      const heading: ContentHeading = {
        id,
        title,
        path: `#${id}`,
        level,
        items: [],
      }

      // Encontrar o pai apropriado para este heading
      // Um heading de nível N deve ser filho do último heading de nível N-1
      let parentLevel = level - 1
      while (parentLevel > 0 && !headingsByLevel[parentLevel]) {
        // Se não encontrarmos um pai de nível imediatamente superior,
        // procuramos níveis ainda mais altos até encontrar um
        parentLevel--
      }

      if (parentLevel === 0) {
        // Heading de nível superior, adiciona à lista principal
        headings.push(heading)
      } else {
        // Heading filho, adiciona ao pai apropriado
        const parent = headingsByLevel[parentLevel]!
        parent.items.push(heading)
      }

      // Atualiza o último heading para este nível
      headingsByLevel[level] = heading

      // Limpa os níveis subsequentes já que este novo heading se torna o pai deles
      for (let i = level + 1; i < headingsByLevel.length; i++) {
        headingsByLevel[i] = null
      }
    }

    return headings
  }

  /**
   * Busca um post específico com base nos critérios fornecidos
   * @param params Parâmetros opcionais para busca do post
   * @returns Promise com o resultado da busca
   * @throws Error quando não encontra um post correspondente ou quando parâmetros inválidos são fornecidos
   */
  async getPost<TType extends keyof TTypes>(
    params?: ContentLayerWherePostsParams<TTypes, TType>,
  ): Promise<ContentTypeResult<
    StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
  > | null> {
    await this.initialize()

    // Se não houver parâmetros, retornamos o primeiro post encontrado (geralmente usado para páginas únicas)
    if (!params) {
      const firstEntry = Array.from(this.contentCache.values())[0]
      if (!firstEntry) return null
      return firstEntry as ContentTypeResult<
        StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
      >
    }

    const { type, where } = params

    // Validação de tipo
    if (!type || !this.options.schemas[type as string]) return null

    // Filtra entradas por tipo
    const typeEntries = Array.from(this.contentCache.values()).filter((entry) =>
      entry.id.startsWith(`${String(type)}:`),
    )

    if (typeEntries.length === 0) return null

    // Filtrar por critérios where
    const filtered = typeEntries.filter((entry) => {
      for (const [key, value] of Object.entries(where)) {
        if (entry.data[key] !== value) {
          return false
        }
      }
      return true
    })

    if (filtered.length === 0) return null

    return filtered[0] as ContentTypeResult<
      StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    >
  }

  /**
   * Busca um post específico pelo slug
   * @param params Parâmetros com o tipo de conteúdo e o slug
   * @returns Promise com o resultado da busca
   * @throws Error quando não encontra um post correspondente ou quando parâmetros inválidos são fornecidos
   */
  async getPostBySlug<TType extends keyof TTypes>(
    type: TType,
    slug: string,
  ): Promise<ContentTypeResult<
    StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
  > | null> {
    await this.initialize()

    // Validação de tipo
    if (!type || !this.options.schemas[type as string]) {
      throw new Error(`Invalid content type: ${String(type)}`)
    }

    // Validação de slug
    if (!slug) {
      throw new Error('Slug is required')
    }

    // Gera o ID do post com base no tipo e slug
    const postId = `${String(type)}:${slug}`

    // Tenta encontrar o post diretamente pelo ID
    const post = this.contentCache.get(postId)

    if (!post) {
      // Se não encontrar diretamente, tenta buscar pelo slug normalizado
      const normalizedSlug = slug.toLowerCase().replace(/\//g, '-')

      // Filtra posts por tipo
      const typeEntries = Array.from(this.contentCache.values()).filter(
        (entry) => entry.id.startsWith(`${String(type)}:`),
      )

      // Tenta encontrar com slug normalizado
      const matchingPost = typeEntries.find((entry) => {
        const entrySlugNormalized = entry.slug.toLowerCase().replace(/\//g, '-')
        return entrySlugNormalized === normalizedSlug
      })

      if (!matchingPost) {
        return null
      }

      return matchingPost as ContentTypeResult<
        StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
      >
    }

    return post as ContentTypeResult<
      StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    >
  }

  /**
   * Lista posts com base nos critérios fornecidos
   */
  async listPosts<TType extends keyof TTypes>(
    params: ContentLayerSearchPostsParams<TTypes, TType>,
  ): Promise<
    ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>[]
  > {
    await this.initialize()

    const {
      type,
      where,
      orderBy,
      orderDirection = 'asc',
      limit,
      offset = 0,
    } = params

    // Validação de tipo
    if (!type || !this.options.schemas[type as string]) {
      throw new Error(`Invalid content type: ${String(type)}`)
    }

    // Filtrar por tipo
    let results = Array.from(this.contentCache.values()).filter((entry) =>
      entry.id.startsWith(`${String(type)}:`),
    )

    if (results.length === 0) {
      return [] // Retorna array vazio se não encontrar conteúdo para o tipo
    }

    // Filtrar por critérios where
    if (where && Object.keys(where).length > 0) {
      results = results.filter((entry) => {
        for (const [key, value] of Object.entries(where)) {
          if (entry.data[key] !== value) {
            return false
          }
        }
        return true
      })
    }

    // Ordenar resultados
    if (orderBy) {
      results.sort((a, b) => {
        const valueA = a.data[orderBy as string]
        const valueB = b.data[orderBy as string]

        if (valueA < valueB) return orderDirection === 'asc' ? -1 : 1
        if (valueA > valueB) return orderDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    // Aplicar paginação
    if (typeof limit === 'number') {
      results = results.slice(offset, offset + limit)
    } else {
      results = results.slice(offset)
    }

    return results as ContentTypeResult<
      StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    >[]
  }

  /**
   * Lista posts agrupados por um campo específico
   */
  async listPostsGroupedBy<TType extends keyof TTypes>({
    type,
    field,
    orderBy,
    orderDirection = 'asc',
  }: {
    type: TType
    field: keyof StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    orderBy?: keyof StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
    orderDirection: 'asc' | 'desc'
  }): Promise<
    Record<
      string,
      ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>[]
    >
  > {
    await this.initialize()

    if (!type || !this.options.schemas[type as string]) {
      throw new Error(`Invalid content type: ${String(type)}`)
    }

    const results = Array.from(this.contentCache.values()).filter((entry) =>
      entry.id.startsWith(`${String(type)}:`),
    )

    if (results.length === 0) {
      return {}
    }

    if (orderBy) {
      results.sort((a, b) => {
        const valueA = a.data[orderBy as string]
        const valueB = b.data[orderBy as string]
        if (valueA < valueB) return orderDirection === 'asc' ? -1 : 1
        if (valueA > valueB) return orderDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    const groupedResults: Record<
      string,
      ContentTypeResult<StandardSchemaV1.InferOutput<TTypes[TType]['schema']>>[]
    > = {}

    for (const result of results) {
      const fieldValue = result.data[field as string]
      if (!groupedResults[fieldValue]) {
        groupedResults[fieldValue] = []
      }
      groupedResults[fieldValue].push(
        result as ContentTypeResult<
          StandardSchemaV1.InferOutput<TTypes[TType]['schema']>
        >,
      )
    }

    return groupedResults
  }

  /**
   * Cria uma entidade ContentLayer com um nome, schema e path
   */
  static entity<TName extends string, TSchema extends StandardSchemaV1>(
    name: TName,
    schema: TSchema,
    path: string,
  ): ContentLayerEntity<TName, TSchema> {
    return { name, schema, path }
  }

  /**
   * Inicializa o ContentLayerProvider com as entidades fornecidas
   */
  static initialize<
    TTypes extends Record<string, ContentLayerEntity<string, StandardSchemaV1>>,
  >(
    options: ContentLayerProviderOptions<TTypes>,
  ): ContentLayerProvider<TTypes> {
    return new ContentLayerProvider<TTypes>(options)
  }
}
