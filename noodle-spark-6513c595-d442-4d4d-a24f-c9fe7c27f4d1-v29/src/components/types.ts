
export interface ImageGeneratorProps {
  subject: string
  style?: string
  context?: string
  negativePrompt?: string
  seed?: number
  cfgScale?: number
  width?: number | string
  height?: number | string
  cornerRadius?: number | string
  containerStyle?: React.CSSProperties
  onGenerate?: (imageUrl: string) => void
  onError?: (error: string) => void
}
export const defaultGenerationConfig = {
  cfgScale: 7.0,
  seed: 0,
  width: "100%",
  height: 300,
  cornerRadius: 8,
} as const
