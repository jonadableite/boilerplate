'server only'

import { ContentLayerProvider } from '@/@saas-boilerplate/providers/content-layer'
import { z } from 'zod'

const HelpSchema = z.object({
  title: z.string(),
  image: z.string().optional(),
  category: z.string(),
  date: z.string(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  authorImage: z.string().optional(),
})

const DocSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()).optional(),
  date: z.string(),
  category: z.string(),
  index: z.number(),
  author: z.string().optional(),
  authorImage: z.string().optional(),
})

const UpdateSchema = z.object({
  title: z.string(),
  image: z.string().optional(),
  category: z.string(),
  date: z.string(),
  author: z.string().optional(),
  authorImage: z.string().optional(),
})

const BlogSchema = z.object({
  title: z.string(),
  cover: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date: z.string(),
  author: z.string().optional(),
  authorImage: z.string().optional(),
})

export const contentLayer = ContentLayerProvider.initialize({
  schemas: {
    help: ContentLayerProvider.entity(
      'help',
      HelpSchema,
      'src/content/posts/help',
    ),
    docs: ContentLayerProvider.entity(
      'docs',
      DocSchema,
      'src/content/posts/docs',
    ),
    blog: ContentLayerProvider.entity(
      'blog',
      BlogSchema,
      'src/content/posts/blog',
    ),
    update: ContentLayerProvider.entity(
      'update',
      UpdateSchema,
      'src/content/posts/updates',
    ),
  },
})
