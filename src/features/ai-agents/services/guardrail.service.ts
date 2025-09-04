import {
  GuardrailValidationInput,
  ValidateInputResult,
  ValidateOutputResult,
} from '../types/services.types'
import { LoggingService } from './logging.service'
import { OpenAI } from 'openai'

export class GuardrailService {
  private loggingService: LoggingService
  private openai: OpenAI

  // Lista de palavras/frases bloqueadas (pode ser expandida)
  private readonly blockedPatterns = [
    // Conteúdo ofensivo
    /\b(fuck|shit|damn|bitch|asshole)\b/gi,
    // Informações pessoais (exemplos básicos)
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN format
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card format
    // Solicitações maliciosas
    /ignore\s+previous\s+instructions/gi,
    /forget\s+everything/gi,
    /act\s+as\s+if\s+you\s+are/gi,
  ]

  // Tópicos sensíveis
  private readonly sensitiveTopics = [
    'violence',
    'hate speech',
    'illegal activities',
    'self-harm',
    'adult content',
    'financial advice',
    'medical advice',
    'legal advice',
  ]

  constructor() {
    this.loggingService = new LoggingService()
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async validateInput(
    input: GuardrailValidationInput & {
      organizationId: string
      agentId: string
      sessionId?: string
    },
  ): Promise<ValidateInputResult> {
    try {
      const { content, guardrails, organizationId, agentId, sessionId } = input
      const violations: string[] = []

      // 1. Verificar comprimento do input
      if (
        guardrails.maxResponseLength &&
        content.length > guardrails.maxResponseLength
      ) {
        violations.push(
          `Input exceeds maximum length of ${guardrails.maxResponseLength} characters`,
        )
      }

      // 2. Verificar padrões bloqueados
      for (const pattern of this.blockedPatterns) {
        if (pattern.test(content)) {
          violations.push('Content contains blocked patterns')
          break
        }
      }

      // 3. Verificar detecção de PII se habilitada
      if (guardrails.enablePiiDetection) {
        const piiViolations = await this.detectPII(content)
        violations.push(...piiViolations)
      }

      // 4. Verificar tópicos bloqueados
      if (guardrails.blockedTopics && guardrails.blockedTopics.length > 0) {
        const topicViolations = await this.checkBlockedTopics(
          content,
          guardrails.blockedTopics,
        )
        violations.push(...topicViolations)
      }

      // 5. Verificar tópicos permitidos (se especificados)
      if (guardrails.allowedTopics && guardrails.allowedTopics.length > 0) {
        const isAllowedTopic = await this.checkAllowedTopics(
          content,
          guardrails.allowedTopics,
        )
        if (!isAllowedTopic) {
          violations.push('Content topic is not in the allowed topics list')
        }
      }

      // 6. Verificar filtro de conteúdo usando OpenAI Moderation
      if (guardrails.enableContentFilter) {
        const moderationViolations = await this.checkContentModeration(content)
        violations.push(...moderationViolations)
      }

      const isValid = violations.length === 0

      // Log das violações
      if (!isValid) {
        await this.loggingService.logWarning({
          organizationId,
          agentId,
          sessionId,
          message: `Input validation failed with ${violations.length} violations`,
          metadata: {
            violations,
          },
        })
      }

      return {
        isValid,
        violations,
        sanitizedInput: isValid ? content : undefined,
      }
    } catch (error) {
      await this.loggingService.logError({
        organizationId: input.organizationId,
        agentId: input.agentId,
        sessionId: input.sessionId,
        message: 'Failed to validate input',
        error: error as Error,
      })

      // Em caso de erro, permitir o conteúdo (fail-safe)
      return {
        isValid: true,
        violations: [],
        sanitizedInput: input.content,
      }
    }
  }

  async validateOutput(
    input: GuardrailValidationInput & {
      organizationId: string
      agentId: string
      sessionId?: string
    },
  ): Promise<ValidateOutputResult> {
    try {
      const { content, guardrails, organizationId, agentId, sessionId } = input
      const violations: string[] = []

      // 1. Verificar comprimento da resposta
      if (
        guardrails.maxResponseLength &&
        content.length > guardrails.maxResponseLength
      ) {
        violations.push(
          `Response exceeds maximum length of ${guardrails.maxResponseLength} characters`,
        )
      }

      // 2. Verificar padrões bloqueados na resposta
      for (const pattern of this.blockedPatterns) {
        if (pattern.test(content)) {
          violations.push('Response contains blocked patterns')
          break
        }
      }

      // 3. Verificar detecção de PII na resposta
      if (guardrails.enablePiiDetection) {
        const piiViolations = await this.detectPII(content)
        violations.push(...piiViolations)
      }

      // 4. Verificar filtro de conteúdo na resposta
      if (guardrails.enableContentFilter) {
        const moderationViolations = await this.checkContentModeration(content)
        violations.push(...moderationViolations)
      }

      // 5. Verificar se a resposta está relacionada aos tópicos permitidos
      if (guardrails.allowedTopics && guardrails.allowedTopics.length > 0) {
        const isRelevantResponse = await this.checkResponseRelevance(
          content,
          guardrails.allowedTopics,
        )
        if (!isRelevantResponse) {
          violations.push('Response is not relevant to allowed topics')
        }
      }

      const isValid = violations.length === 0
      let sanitizedOutput = content

      // Se há violações, tentar sanitizar
      if (!isValid) {
        // Tentar sanitizar conteúdo
        sanitizedOutput = await this.sanitizeContent(content)

        // Se ainda há problemas graves, usar mensagem de fallback
        if (
          violations.some(
            (v) => v.includes('blocked patterns') || v.includes('policy'),
          )
        ) {
          sanitizedOutput =
            'I apologize, but I cannot provide a response to that request.'
        }

        await this.loggingService.logWarning({
          organizationId,
          agentId,
          sessionId,
          message: `Output validation failed with ${violations.length} violations`,
          metadata: {
            violations,
            sanitized: !!sanitizedOutput,
          },
        })
      }

      return {
        isValid,
        violations,
        sanitizedOutput,
      }
    } catch (error) {
      await this.loggingService.logError({
        organizationId: input.organizationId,
        agentId: input.agentId,
        sessionId: input.sessionId,
        message: 'Failed to validate output',
        error: error as Error,
      })

      // Em caso de erro, retornar conteúdo original (fail-safe)
      return {
        isValid: true,
        violations: [],
        sanitizedOutput: input.content,
      }
    }
  }

  // Métodos auxiliares privados
  private async detectPII(content: string): Promise<string[]> {
    const violations: string[] = []

    // Padrões básicos de PII
    const piiPatterns = [
      {
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        type: 'SSN',
        message: 'Content contains Social Security Number',
      },
      {
        pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        type: 'Credit Card',
        message: 'Content contains credit card number',
      },
      {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        type: 'Email',
        message: 'Content contains email address',
      },
      {
        pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g,
        type: 'Phone',
        message: 'Content contains phone number',
      },
    ]

    for (const { pattern, type, message } of piiPatterns) {
      if (pattern.test(content)) {
        violations.push(`${message} (${type})`)
      }
    }

    return violations
  }

  private async checkContentModeration(content: string): Promise<string[]> {
    try {
      const response = await this.openai.moderations.create({
        input: content,
      })

      const violations: string[] = []
      const result = response.results[0]

      if (result.flagged) {
        const flaggedCategories = Object.entries(result.categories)
          .filter(([, flagged]) => flagged)
          .map(([category]) => category)

        violations.push(
          `Content violates policy: ${flaggedCategories.join(', ')}`,
        )
      }

      return violations
    } catch (error) {
      // Se a moderação falhar, não bloquear o conteúdo
      return []
    }
  }

  private async checkBlockedTopics(
    content: string,
    blockedTopics: string[],
  ): Promise<string[]> {
    const violations: string[] = []

    // Verificação simples por palavras-chave
    const lowerContent = content.toLowerCase()
    for (const topic of blockedTopics) {
      if (lowerContent.includes(topic.toLowerCase())) {
        violations.push(`Content relates to blocked topic: ${topic}`)
      }
    }

    return violations
  }

  private async checkAllowedTopics(
    content: string,
    allowedTopics: string[],
  ): Promise<boolean> {
    // Verificação simples por palavras-chave
    const lowerContent = content.toLowerCase()
    return allowedTopics.some((topic) =>
      lowerContent.includes(topic.toLowerCase()),
    )
  }

  private async checkResponseRelevance(
    content: string,
    allowedTopics: string[],
  ): Promise<boolean> {
    // Implementação básica - pode ser melhorada com análise semântica
    return this.checkAllowedTopics(content, allowedTopics)
  }

  private async sanitizeContent(content: string): Promise<string> {
    let sanitized = content

    // Remover PII detectado
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, // Phone
    ]

    for (const pattern of piiPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    }

    // Remover padrões bloqueados
    for (const pattern of this.blockedPatterns) {
      sanitized = sanitized.replace(pattern, '[FILTERED]')
    }

    return sanitized
  }
}
