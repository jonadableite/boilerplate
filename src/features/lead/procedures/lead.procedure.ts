import { igniter } from "@/igniter";
import type {
  Lead,
  CreateLeadDTO,
  UpdateLeadDTO,
  LeadQueryParams,
} from "../lead.interface";
import type { Prisma } from "@prisma/client";
import { OrganizationMetadata } from "@/@saas-boilerplate/features/organization";
import { parseMetadata } from "@/utils/parse-metadata";

export const LeadFeatureProcedure = igniter.procedure({
  name: "LeadFeatureProcedure",
  handler: async (_, { context }) => {
    return {
      lead: {
        findMany: async (query: LeadQueryParams): Promise<Lead[]> => {
          const result = await context.providers.database.lead.findMany({
            where: {
              OR: query.search
                ? [
                    { email: { contains: query.search, mode: "insensitive" } },
                    { name: { contains: query.search, mode: "insensitive" } },
                    { phone: { contains: query.search, mode: "insensitive" } },
                  ]
                : undefined,
              organizationId: query.organizationId,
            },
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              metadata: true,
              createdAt: true,
              updatedAt: true,
              organizationId: true,
              submissions: {
                select: {
                  id: true,
                  createdAt: true,
                  metadata: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 5, // Limitar a 5 submissions mais recentes
              },
            },
            skip: query.page
              ? (Number(query.page) - 1) * (Number(query.limit) || 10)
              : undefined,
            take: query.limit ? Number(query.limit) : undefined,
            orderBy: query.sortBy
              ? { [query.sortBy]: query.sortOrder || "asc" }
              : { createdAt: "desc" },
          });

          return result as Lead[];
        },

        findOne: async (params: {
          id: string;
          organizationId: string;
        }): Promise<Lead | null> => {
          const result = await context.providers.database.lead.findUnique({
            where: {
              id: params.id,
              organizationId: params.organizationId,
            },
            include: {
              submissions: true,
            },
          });

          return result as Lead;
        },

        create: async (input: CreateLeadDTO): Promise<Lead> => {
          const result = await context.providers.database.lead.create({
            data: {
              email: input.email,
              name: input.name,
              phone: input.phone,
              metadata: input.metadata as Prisma.InputJsonValue,
              organizationId: input.organizationId,
            },
            include: {
              organization: true,
            },
          });

          const orgMetadata = parseMetadata<OrganizationMetadata>(
            result.organization.metadata,
          );

          await context.providers.mail.send({
            template: "notification",
            to: orgMetadata.contact?.email as string,
            data: {
              email: orgMetadata.contact?.email as string,
              details: `You have received a new lead from ${input.name} (${input.email})`,
              organization: result.organization.name,
            },
          });

          return result as Lead;
        },

        update: async (
          params: { id: string } & UpdateLeadDTO,
        ): Promise<Lead> => {
          const lead = await context.providers.database.lead.findUnique({
            where: { id: params.id },
          });

          if (!lead) throw new Error("Lead not found");

          const result = await context.providers.database.lead.update({
            where: { id: params.id },
            data: {
              email: params.email,
              name: params.name,
              phone: params.phone,
              metadata: params.metadata as Prisma.InputJsonValue,
            },
          });

          return result as Lead;
        },

        delete: async (params: {
          id: string;
          organizationId: string;
        }): Promise<{ id: string }> => {
          await context.providers.database.lead.delete({
            where: { id: params.id, organizationId: params.organizationId },
          });

          return { id: params.id };
        },

        bulkImport: async (params: {
          file: string;
          filename: string;
          organizationId: string;
        }): Promise<{
          success: number;
          errors: Array<{ row: number; message: string }>;
          total: number;
        }> => {
          const XLSX = require("xlsx");

          try {
            // Decodificar arquivo base64
            const base64Data = params.file.split(",")[1] || params.file;
            const buffer = Buffer.from(base64Data, "base64");

            // Ler arquivo Excel/CSV
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Converter para JSON
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (data.length < 2) {
              throw new Error(
                "Arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados",
              );
            }

            const headers = data[0] as string[];
            const rows = data.slice(1) as any[][];

            // Validar cabeçalhos obrigatórios
            const requiredHeaders = ["nome", "email"];
            const headerMap: { [key: string]: number } = {};

            // Mapear cabeçalhos (case insensitive)
            headers.forEach((header, index) => {
              const normalizedHeader = header.toString().toLowerCase().trim();
              headerMap[normalizedHeader] = index;
            });

            // Verificar se os cabeçalhos obrigatórios existem
            const missingHeaders = requiredHeaders.filter(
              (header) => !(header in headerMap),
            );

            if (missingHeaders.length > 0) {
              throw new Error(
                `Cabeçalhos obrigatórios não encontrados: ${missingHeaders.join(", ")}`,
              );
            }

            // Verificar limites do plano
            const currentLeadsCount =
              await context.providers.database.lead.count({
                where: { organizationId: params.organizationId },
              });

            // Buscar informações do plano da organização
            const organization =
              await context.providers.database.organization.findUnique({
                where: { id: params.organizationId },
                include: {
                  billing: {
                    include: {
                      subscriptions: {
                        where: { status: "active" },
                        include: {
                          price: {
                            include: {
                              plan: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              });

            let leadLimit = 100; // Limite padrão do plano free

            if (
              organization?.billing?.subscriptions?.[0]?.price?.plan?.metadata
            ) {
              const planMetadata = organization.billing.subscriptions[0].price
                .plan.metadata as any;
              const leadFeature = planMetadata.features?.find(
                (f: any) => f.slug === "leads",
              );
              if (leadFeature?.limit) {
                leadLimit = leadFeature.limit;
              }
            }

            const remainingLeads = leadLimit - currentLeadsCount;

            if (rows.length > remainingLeads) {
              throw new Error(
                `Você pode importar no máximo ${remainingLeads} leads. Seu plano permite ${leadLimit} leads no total e você já tem ${currentLeadsCount}.`,
              );
            }

            const results = {
              success: 0,
              errors: [] as Array<{ row: number; message: string }>,
              total: rows.length,
            };

            // Processar cada linha
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              const rowNumber = i + 2; // +2 porque começamos da linha 2 (após cabeçalho)

              try {
                const nome = row[headerMap["nome"]]?.toString()?.trim();
                const email = row[headerMap["email"]]?.toString()?.trim();
                const telefone =
                  row[headerMap["telefone"]]?.toString()?.trim() ||
                  row[headerMap["phone"]]?.toString()?.trim();

                // Validações
                if (!nome) {
                  results.errors.push({
                    row: rowNumber,
                    message: "Nome é obrigatório",
                  });
                  continue;
                }

                if (!email) {
                  results.errors.push({
                    row: rowNumber,
                    message: "Email é obrigatório",
                  });
                  continue;
                }

                // Validar formato do email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                  results.errors.push({
                    row: rowNumber,
                    message: "Formato de email inválido",
                  });
                  continue;
                }

                // Verificar se o lead já existe
                const existingLead =
                  await context.providers.database.lead.findFirst({
                    where: {
                      email: email,
                      organizationId: params.organizationId,
                    },
                  });

                if (existingLead) {
                  results.errors.push({
                    row: rowNumber,
                    message: "Lead com este email já existe",
                  });
                  continue;
                }

                // Criar o lead
                await context.providers.database.lead.create({
                  data: {
                    name: nome,
                    email: email,
                    phone: telefone || null,
                    organizationId: params.organizationId,
                    metadata: {
                      source: "bulk_import",
                      filename: params.filename,
                      importedAt: new Date().toISOString(),
                    },
                  },
                });

                results.success++;
              } catch (error) {
                results.errors.push({
                  row: rowNumber,
                  message:
                    error.message || "Erro desconhecido ao processar linha",
                });
              }
            }

            return results;
          } catch (error) {
            throw new Error(`Erro ao processar arquivo: ${error.message}`);
          }
        },
      },
    };
  },
});
