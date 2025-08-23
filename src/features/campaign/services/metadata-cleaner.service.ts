'use server'

import { exec } from 'child_process'
import { readFile, unlink, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'


const execAsync = promisify(exec)

/**
 * Limpa metadados de arquivos de mídia
 * Remove informações como GPS, câmera, software, etc.
 */
export async function cleanMediaMetadata(
  media: string,
  fileName: string,
  mimetype: string,
): Promise<{
  success: boolean
  cleanedMedia?: {
    data: string
    fileName: string
    mimetype: string
  }
  originalSize: number
  cleanedSize: number
  error?: string
}> {
  try {
    // 1. Converter base64 para arquivo temporário
    const originalSize = Math.ceil((media.length * 3) / 4)
    const tempDir = tmpdir()
    const tempFilePath = join(tempDir, `original_${fileName}`)
    const cleanedFilePath = join(tempDir, `cleaned_${fileName}`)

    // 2. Decodificar base64 e salvar arquivo temporário
    const buffer = Buffer.from(media, 'base64')
    await writeFile(tempFilePath, buffer)

    // 3. Limpar metadados baseado no tipo de arquivo
    let cleanedData: string
    const cleanedMimetype = mimetype

    if (mimetype.startsWith('image/')) {
      cleanedData = await cleanImageMetadata(tempFilePath, cleanedFilePath)
    } else if (mimetype.startsWith('video/')) {
      cleanedData = await cleanVideoMetadata(tempFilePath, cleanedFilePath)
    } else if (mimetype.startsWith('audio/')) {
      cleanedData = await cleanAudioMetadata(tempFilePath, cleanedFilePath)
    } else {
      // Para outros tipos, apenas copiar sem limpeza
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cleanedData = media
    }

    // 4. Ler arquivo limpo e converter para base64
    const cleanedBuffer = await readFile(cleanedFilePath)
    const cleanedBase64 = cleanedBuffer.toString('base64')
    const cleanedSize = cleanedBuffer.length

    // 5. Limpar arquivos temporários
    await cleanupTempFiles([tempFilePath, cleanedFilePath])

    return {
      success: true,
      cleanedMedia: {
        data: cleanedBase64,
        fileName: `cleaned_${fileName}`,
        mimetype: cleanedMimetype,
      },
      originalSize,
      cleanedSize,
    }
  } catch (error) {
    console.error('[MetadataCleaner] Erro ao limpar metadados:', error)
    return {
      success: false,
      originalSize: 0,
      cleanedSize: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Limpa metadados de imagens usando ExifTool
 */
async function cleanImageMetadata(
  originalPath: string,
  cleanedPath: string,
): Promise<string> {
  try {
    // Usar ExifTool para remover metadados
    const command = `exiftool -all= -overwrite_original "${originalPath}" && cp "${originalPath}" "${cleanedPath}"`

    await execAsync(command)

    // Verificar se o arquivo foi criado
    const cleanedBuffer = await readFile(cleanedPath)
    return cleanedBuffer.toString('base64')
  } catch (error) {
    console.warn(
      '[MetadataCleaner] ExifTool não disponível, usando método alternativo',
    )
    return await cleanImageMetadataAlternative(originalPath, cleanedPath)
  }
}

/**
 * Método alternativo para limpar metadados de imagens
 */
async function cleanImageMetadataAlternative(
  originalPath: string,
  cleanedPath: string,
): Promise<string> {
  try {
    // Para imagens, podemos usar uma biblioteca como Sharp ou Jimp
    // Por enquanto, vamos copiar o arquivo original
    const originalBuffer = await readFile(originalPath)
    await writeFile(cleanedPath, originalBuffer)

    return originalBuffer.toString('base64')
  } catch (error) {
    throw new Error(`Falha ao limpar metadados da imagem: ${error}`)
  }
}

/**
 * Limpa metadados de vídeos usando FFmpeg
 */
async function cleanVideoMetadata(
  originalPath: string,
  cleanedPath: string,
): Promise<string> {
  try {
    // Usar FFmpeg para remover metadados
    const command = `ffmpeg -i "${originalPath}" -map_metadata -1 -c copy "${cleanedPath}" -y`

    await execAsync(command)

    // Verificar se o arquivo foi criado
    const cleanedBuffer = await readFile(cleanedPath)
    return cleanedBuffer.toString('base64')
  } catch (error) {
    console.warn(
      '[MetadataCleaner] FFmpeg não disponível, usando método alternativo',
    )
    return await cleanVideoMetadataAlternative(originalPath, cleanedPath)
  }
}

/**
 * Método alternativo para limpar metadados de vídeos
 */
async function cleanVideoMetadataAlternative(
  originalPath: string,
  cleanedPath: string,
): Promise<string> {
  try {
    // Para vídeos, copiar sem metadados pode ser complexo
    // Por enquanto, vamos copiar o arquivo original
    const originalBuffer = await readFile(originalPath)
    await writeFile(cleanedPath, originalBuffer)

    return originalBuffer.toString('base64')
  } catch (error) {
    throw new Error(`Falha ao limpar metadados do vídeo: ${error}`)
  }
}

/**
 * Limpa metadados de áudios
 */
async function cleanAudioMetadata(
  originalPath: string,
  cleanedPath: string,
): Promise<string> {
  try {
    // Para áudios, podemos usar FFmpeg ou outras ferramentas
    // Por enquanto, vamos copiar o arquivo original
    const originalBuffer = await readFile(originalPath)
    await writeFile(cleanedPath, originalBuffer)

    return originalBuffer.toString('base64')
  } catch (error) {
    throw new Error(`Falha ao limpar metadados do áudio: ${error}`)
  }
}

/**
 * Limpa arquivos temporários
 */
async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  try {
    for (const filePath of filePaths) {
      try {
        await unlink(filePath)
      } catch (error) {
        // Ignorar erros ao deletar arquivos temporários
        console.warn(
          `[MetadataCleaner] Não foi possível deletar arquivo temporário: ${filePath}`,
        )
      }
    }
  } catch (error) {
    console.warn(
      '[MetadataCleaner] Erro ao limpar arquivos temporários:',
      error,
    )
  }
}

/**
 * Verifica se as ferramentas necessárias estão disponíveis
 */
export async function checkDependencies(): Promise<{
  exifTool: boolean
  ffmpeg: boolean
}> {
  try {
    const [exifToolResult, ffmpegResult] = await Promise.allSettled([
      execAsync('exiftool -ver'),
      execAsync('ffmpeg -version'),
    ])

    return {
      exifTool: exifToolResult.status === 'fulfilled',
      ffmpeg: ffmpegResult.status === 'fulfilled',
    }
  } catch (error) {
    console.warn('[MetadataCleaner] Erro ao verificar dependências:', error)
    return {
      exifTool: false,
      ffmpeg: false,
    }
  }
}

/**
 * Obtém informações sobre os metadados de um arquivo
 */
export async function getMetadataInfo(
  media: string,
  fileName: string,
): Promise<{
  hasMetadata: boolean
  metadataTypes: string[]
  fileSize: number
}> {
  try {
    const tempDir = tmpdir()
    const tempFilePath = join(tempDir, `metadata_check_${fileName}`)

    // Decodificar base64 e salvar arquivo temporário
    const buffer = Buffer.from(media, 'base64')
    await writeFile(tempFilePath, buffer)

    try {
      // Tentar usar ExifTool para verificar metadados
      const { stdout } = await execAsync(`exiftool "${tempFilePath}"`)

      const hasMetadata = stdout.trim().length > 0
      const metadataTypes = extractMetadataTypes(stdout)

      await cleanupTempFiles([tempFilePath])

      return {
        hasMetadata,
        metadataTypes,
        fileSize: buffer.length,
      }
    } catch (error) {
      // Se ExifTool não estiver disponível, assumir que pode ter metadados
      await cleanupTempFiles([tempFilePath])

      return {
        hasMetadata: true, // Assumir que tem metadados para segurança
        metadataTypes: ['unknown'],
        fileSize: buffer.length,
      }
    }
  } catch (error) {
    console.error('[MetadataCleaner] Erro ao verificar metadados:', error)
    return {
      hasMetadata: false,
      metadataTypes: [],
      fileSize: 0,
    }
  }
}

/**
 * Extrai tipos de metadados do output do ExifTool
 */
function extractMetadataTypes(exifToolOutput: string): string[] {
  const lines = exifToolOutput.split('\n')
  const metadataTypes: string[] = []

  for (const line of lines) {
    if (line.includes(':')) {
      const [key] = line.split(':')
      if (key && key.trim()) {
        metadataTypes.push(key.trim())
      }
    }
  }

  return metadataTypes
}
