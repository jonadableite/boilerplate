import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { discord } from '../plugins/discord.plugin'
import { evolutionApi } from '../plugins/evolution-api.plugin'
import { mailchimp } from '../plugins/mailchimp.plugin'
import { make } from '../plugins/make.plugin'
import { slack } from '../plugins/slack.plugin'
import { telegram } from '../plugins/telegram.plugin'
import { whatsapp } from '../plugins/whatsapp.plugin'
import { zapier } from '../plugins/zapier.plugin'

export const plugins = PluginManager.initialize({
  plugins: {
    telegram,
    zapier,
    make,
    discord,
    slack,
    whatsapp,
    mailchimp,
    evolutionApi,
  },
})
