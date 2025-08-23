// Exportar tipos
export * from './campaign.types'

// Exportar controller
export { CampaignController } from './controllers/campaign.controller'

// Exportar procedures
export { CampaignFeatureProcedure } from './procedures/campaign.procedure'

// Exportar serviços
export { InstanceRotationServiceImpl } from './services/instance-rotation.service'
export { MessageDispatcherService } from './services/message-dispatcher.service'
export {
  checkDependencies,
  cleanMediaMetadata,
  getMetadataInfo
} from './services/metadata-cleaner.service'
// eslint-disable-next-line prettier/prettier

