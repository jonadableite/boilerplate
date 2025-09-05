const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestAgent() {
  try {
    // Verificar se o agente já existe
    const existingAgent = await prisma.aIAgent.findUnique({
      where: { id: 'dc74e91d-68ff-43d8-8dd2-5cc90a00cbdf' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      }
    })
    
    if (existingAgent) {
      console.log('Agente já existe:', existingAgent)
      
      // Verificar todas as organizações disponíveis
      const organizations = await prisma.organization.findMany({
        select: { id: true, name: true, slug: true }
      })
      console.log('Organizações disponíveis:', organizations)
      
      // Verificar todos os usuários disponíveis
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
      })
      console.log('Usuários disponíveis:', users)
      
      return
    }
    
    // Se não existe, criar o agente
    console.log('Agente não encontrado, criando...')
    
  } catch (error) {
    console.error('Erro ao criar agente de teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestAgent()