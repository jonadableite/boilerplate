import { useState, useCallback } from "react";
import { api } from "@/igniter.client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface KnowledgeFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  chunksCount: number;
  processedAt: Date;
  metadata?: any;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
}

export function useKnowledgeUpload(agentId: string) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Upload mutation
  const uploadMutation = (api.knowledge.upload as any).useMutation({
    onSuccess: (data: any) => {
      setUploadProgress((prev) =>
        prev.map((progress) =>
          progress.fileId === data.id
            ? { ...progress, progress: 100, status: "completed" as const }
            : progress,
        ),
      );

      // Refresh knowledge files list
      queryClient.invalidateQueries({ queryKey: ["knowledge", agentId] });
    },
    onError: (error: any) => {
      console.error("Upload failed:", error);
      // Update progress to show error
      setUploadProgress((prev) =>
        prev.map((progress) =>
          progress.status === "uploading"
            ? { ...progress, progress: 0, status: "error" as const }
            : progress,
        ),
      );
    },
  });

  // Query to get knowledge files
  const {
    data: knowledgeFiles = [],
    isLoading,
    refetch: refetchFiles,
  } = (api.knowledge.list as any).useQuery(agentId, { enabled: !!agentId });

  // Remove file mutation
  const removeMutation = (api.knowledge.delete as any).useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", agentId] });
    },
  });

  // Função para validar arquivos
  const validateFiles = useCallback(
    (
      files: File[],
    ): { valid: File[]; invalid: { file: File; reason: string }[] } => {
      const valid: File[] = [];
      const invalid: { file: File; reason: string }[] = [];

      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      const maxSize = 10 * 1024 * 1024; // 10MB

      files.forEach((file) => {
        if (!allowedTypes.includes(file.type)) {
          invalid.push({ file, reason: "Tipo de arquivo não suportado" });
        } else if (file.size > maxSize) {
          invalid.push({ file, reason: "Arquivo muito grande (máximo 10MB)" });
        } else {
          valid.push(file);
        }
      });

      return { valid, invalid };
    },
    [],
  );

  // Função para fazer upload dos arquivos
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!agentId) {
        toast.error("ID do agente não fornecido");
        return;
      }

      const { valid, invalid } = validateFiles(files);

      // Mostrar erros de validação
      invalid.forEach(({ file, reason }) => {
        toast.error(`${file.name}: ${reason}`);
      });

      if (valid.length === 0) {
        return;
      }

      setIsUploading(true);

      // Inicializar progresso
      const initialProgress: UploadProgress[] = valid.map((file) => ({
        fileId: `temp-${Date.now()}-${Math.random()}`,
        fileName: file.name,
        progress: 0,
        status: "uploading",
      }));

      setUploadProgress(initialProgress);

      try {
        // Criar FormData
        const formData = new FormData();
        formData.append("agentId", agentId);

        valid.forEach((file) => {
          formData.append("files", file);
        });

        // Simular progresso de upload
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) =>
            prev.map((p) => ({
              ...p,
              progress: Math.min(p.progress + Math.random() * 20, 90),
            })),
          );
        }, 500);

        // Fazer upload
        const response = await fetch("/api/knowledge/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error("Falha no upload");
        }

        const result = await response.json();

        // Completar progresso
        setUploadProgress((prev) =>
          prev.map((p) => ({
            ...p,
            progress: 100,
            status: "completed" as const,
          })),
        );

        // Atualizar lista de arquivos
        refetchFiles();

        toast.success(
          `${result.files.length} arquivo(s) processado(s) com sucesso!`,
        );

        // Limpar progresso após um tempo
        setTimeout(() => {
          setUploadProgress([]);
          setIsUploading(false);
        }, 2000);
      } catch (error: any) {
        // Marcar como erro
        setUploadProgress((prev) =>
          prev.map((p) => ({
            ...p,
            status: "error" as const,
            error: error.message,
          })),
        );

        toast.error(`Erro no upload: ${error.message}`);
        setIsUploading(false);
      }
    },
    [agentId, validateFiles, refetchFiles],
  );

  const removeFile = async (fileId: string) => {
    try {
      await removeMutation.mutateAsync({ fileId });
    } catch (error) {
      console.error("Remove file error:", error);
    }
  };

  // Função para formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Função para obter ícone do tipo de arquivo
  const getFileIcon = useCallback((type: string): string => {
    switch (type) {
      case "application/pdf":
        return "📄";
      case "text/plain":
        return "📝";
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "📘";
      default:
        return "📎";
    }
  }, []);

  return {
    // Estado
    files: knowledgeFiles,
    uploadProgress,
    isUploading,

    // Ações
    uploadFiles,
    removeFile,
    refetchFiles,

    // Utilitários
    validateFiles,
    formatFileSize,
    getFileIcon,

    // Status das mutations
    isUploadingMutation: uploadMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export type UseKnowledgeUploadReturn = ReturnType<typeof useKnowledgeUpload>;
