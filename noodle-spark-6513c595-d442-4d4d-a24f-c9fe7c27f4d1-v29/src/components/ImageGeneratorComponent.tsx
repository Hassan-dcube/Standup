import React, { memo, useEffect, useState } from "react"
import { ImageGeneratorProps, defaultGenerationConfig } from "./types"
type Props = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  keyof ImageGeneratorProps
> &
  ImageGeneratorProps
function ImageGenerator({
  subject,
  style,
  context,
  negativePrompt,
  width = defaultGenerationConfig.width,
  height = defaultGenerationConfig.height,
  cornerRadius = defaultGenerationConfig.cornerRadius,
  containerStyle,
  onGenerate,
  className,
  ...rest
}: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const generateImage = async () => {
      if (!subject) {
        setImageUrl(null)
        return
      }
      setLoading(true)
      const formData = new FormData()
      formData.append("subject", subject)
      if (style) {
        formData.append("style", style)
      }
      if (context) {
        formData.append("context", context)
      }
      if (negativePrompt) {
        formData.append("negative_prompt", negativePrompt)
      }
      const response = await fetch(
        "https://noodle-python-apis.vercel.app/generate_image/",
        {
          method: "POST",
          body: formData,
        }
      )
      if (!response.ok) {
        setLoading(false)
        return
      }
      const data = await response.json()
      setImageUrl(data.image_url)
      onGenerate?.(data.image_url)
      setLoading(false)
    }
    generateImage()
  }, [subject, style, context, negativePrompt, onGenerate])
  const containerStyles: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: cornerRadius,
    ...containerStyle,
  }
  const imageStyles: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: cornerRadius,
  }
  return (
    <div
      {...rest}
      className={className}
      style={containerStyles}
      onError={undefined}
    >
      <div className="flex h-full flex-col">
        <div
          className="flex-grow overflow-hidden border bg-white shadow-sm"
          style={{ borderRadius: cornerRadius }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Generated image"
              style={imageStyles}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400">
              {loading ? "Generating..." : "Image preview will appear here"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export const ImageGeneratorComponent = memo(ImageGenerator)
ImageGeneratorComponent.displayName = "ImageGenerator"
export default ImageGeneratorComponent
