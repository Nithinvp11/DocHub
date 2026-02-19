declare module 'turndown-plugin-gfm' {
  import TurndownService from 'turndown'
  
  export interface GfmPluginOptions {
    highlightedCodeBlock?: boolean
    strikethrough?: boolean
    tables?: boolean
    taskListItems?: boolean
  }
  
  export const gfm: TurndownService.Plugin
  export const tables: TurndownService.Plugin
  export const strikethrough: TurndownService.Plugin
  export const taskListItems: TurndownService.Plugin
  export const highlightedCodeBlock: TurndownService.Plugin
}
