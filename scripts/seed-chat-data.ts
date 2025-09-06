import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedChatData() {
  try {
    console.log('🌱 Seeding chat data...')

    // Get the first organization (assuming it exists)
    const organization = await prisma.organization.findFirst()

    if (!organization) {
      console.log(
        '❌ No organization found. Please create an organization first.',
      )
      return
    }

    console.log(`📋 Using organization: ${organization.name}`)

    // Create test contacts
    const contacts = await Promise.all([
      prisma.contact.upsert({
        where: {
          organizationId_whatsappNumber: {
            whatsappNumber: '+5511999999999',
            organizationId: organization.id,
          },
        },
        update: {},
        create: {
          name: 'João Silva',
          whatsappNumber: '+5511999999999',
          email: 'joao@example.com',
          organizationId: organization.id,
          metadata: {
            source: 'whatsapp',
            profilePicture: null,
          },
        },
      }),
      prisma.contact.upsert({
        where: {
          organizationId_whatsappNumber: {
            whatsappNumber: '+5511888888888',
            organizationId: organization.id,
          },
        },
        update: {},
        create: {
          name: 'Maria Santos',
          whatsappNumber: '+5511888888888',
          email: 'maria@example.com',
          organizationId: organization.id,
          metadata: {
            source: 'whatsapp',
            profilePicture: null,
          },
        },
      }),
      prisma.contact.upsert({
        where: {
          organizationId_whatsappNumber: {
            whatsappNumber: '+5511777777777',
            organizationId: organization.id,
          },
        },
        update: {},
        create: {
          name: 'Pedro Costa',
          whatsappNumber: '+5511777777777',
          organizationId: organization.id,
          metadata: {
            source: 'whatsapp',
            profilePicture: null,
          },
        },
      }),
    ])

    console.log(`✅ Created ${contacts.length} contacts`)

    // Get or create a WhatsApp instance
    let whatsappInstance = await prisma.whatsAppInstance.findFirst({
      where: { organizationId: organization.id }
    })

    if (!whatsappInstance) {
      whatsappInstance = await prisma.whatsAppInstance.create({
        data: {
          name: 'Test Instance',
          instanceKey: 'test-instance',
          organizationId: organization.id,
          status: 'open',
          metadata: {
            isTest: true
          }
        }
      })
      console.log('✅ Created WhatsApp instance')
    }

    // Create conversations for each contact
    const conversations = await Promise.all(
      contacts.map((contact, index) => 
        prisma.conversation.upsert({
          where: {
            organizationId_whatsappChatId_whatsappInstanceId: {
              organizationId: organization.id,
              whatsappChatId: contact.whatsappNumber,
              whatsappInstanceId: whatsappInstance!.id
            }
          },
          update: {},
          create: {
            whatsappChatId: contact.whatsappNumber,
            contactId: contact.id,
            organizationId: organization.id,
            whatsappInstanceId: whatsappInstance!.id,
            status: 'OPEN',
            isGroup: false,
            metadata: {
              platform: 'whatsapp',
              instanceId: whatsappInstance!.instanceKey
            }
          }
        })
      )
    )

    console.log(`✅ Created ${conversations.length} conversations`)

    // Create sample messages for each conversation
    for (const conversation of conversations) {
      const contact = contacts.find((c) => c.id === conversation.contactId)
      const now = new Date()
      
      await Promise.all([
        // Message from contact
        prisma.message.create({
          data: {
            conversationId: conversation.id,
            organizationId: organization.id,
            contactId: contact?.id,
            content: `Olá! Sou ${contact?.name}. Como posso ajudar?`,
            type: 'TEXT',
            direction: 'INBOUND',
            status: 'DELIVERED',
            timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
            fromMe: false,
            fromName: contact?.name,
            fromNumber: contact?.whatsappNumber,
            metadata: {
              platform: 'whatsapp',
              messageId: `msg_${Date.now()}_1`,
            },
          },
        }),
        // Response message
        prisma.message.create({
          data: {
            conversationId: conversation.id,
            organizationId: organization.id,
            content:
              'Olá! Obrigado por entrar em contato. Em que posso ajudá-lo hoje?',
            type: 'TEXT',
            direction: 'OUTBOUND',
            status: 'DELIVERED',
            timestamp: new Date(now.getTime() - 3000000), // 50 minutes ago
            fromMe: true,
            metadata: {
              platform: 'whatsapp',
              messageId: `msg_${Date.now()}_2`,
            },
          },
        }),
        // Another message from contact
        prisma.message.create({
          data: {
            conversationId: conversation.id,
            organizationId: organization.id,
            contactId: contact?.id,
            content: 'Gostaria de saber mais sobre seus serviços.',
            type: 'TEXT',
            direction: 'INBOUND',
            status: 'DELIVERED',
            timestamp: new Date(now.getTime() - 1800000), // 30 minutes ago
            fromMe: false,
            fromName: contact?.name,
            fromNumber: contact?.whatsappNumber,
            metadata: {
              platform: 'whatsapp',
              messageId: `msg_${Date.now()}_3`,
            },
          },
        }),
      ])
    }

    console.log('✅ Created sample messages for all conversations')
    console.log('🎉 Chat data seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding chat data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedChatData().catch((error) => {
  console.error(error)
  process.exit(1)
})
