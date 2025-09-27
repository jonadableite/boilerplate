import { igniter } from "@/igniter";
import {
  type User,
  type UpdateUserDTO,
  UserMetadataSchema,
} from "../user.interface";
import { updateMetadataSafe } from "@/utils/update-metadata";

export const UserFeatureProcedure = igniter.procedure({
  name: "UserFeatureProcedure",
  handler: async (_, { context, request }) => {
    return {
      user: {
        listMemberships: async () => {
          return context.providers.auth.api.listOrganizations({
            headers: request.headers,
          });
        },

        update: async (params: UpdateUserDTO): Promise<User> => {
          const user = await context.providers.database.user.findUnique({
            where: { id: params.id },
          });

          if (!user) throw new Error("User not found");

          if (params.metadata) {
            await updateMetadataSafe("user", {
              field: "metadata",
              where: { id: user.id },
              data: params.metadata || {},
              schema: UserMetadataSchema,
            });
          }

          return context.providers.database.user.update({
            where: { id: params.id },
            data: {
              name: params.name,
              image: params.image,
            },
          });
        },

        delete: async (params: { id: string }): Promise<{ id: string }> => {
          await context.providers.database.user.delete({
            where: { id: params.id },
          });

          return { id: params.id };
        },
      },
    };
  },
});
