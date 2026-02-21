/**
 * AI Services for Content and Image Generation
 * Uses Google Gemini (Nano Banana) for image generation and content creation
 */

import { GoogleGenAI } from "@google/genai"

// Initialize the Gemini client
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required")
  }
  return new GoogleGenAI({ apiKey })
}

// ==================== Types ====================

export interface ImageGenerationOptions {
  prompt: string
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  style?: "photorealistic" | "digital-art" | "illustration" | "3d-render"
  model?: "gemini-2.5-flash-image" | "gemini-3-pro-image-preview"
}

export interface ImageGenerationResult {
  success: boolean
  imageData?: string // Base64 encoded
  mimeType?: string
  error?: string
}

export interface ContentGenerationOptions {
  topic: string
  keywords?: string[]
  tone?: "professional" | "casual" | "educational" | "technical"
  length?: "short" | "medium" | "long"
  locale?: string
  includeExcerpt?: boolean
  includeSeoMeta?: boolean
}

export interface ContentGenerationResult {
  success: boolean
  title?: string
  content?: string
  excerpt?: string
  seoTitle?: string
  seoDescription?: string
  tags?: string[]
  category?: string
  error?: string
}

export interface AutoblogGenerationOptions {
  topic: string
  keywords?: string[]
  category?: string
  locale?: string
  generateImage?: boolean
  imageStyle?: ImageGenerationOptions["style"]
  tone?: ContentGenerationOptions["tone"]
  length?: ContentGenerationOptions["length"]
}

export interface AutoblogGenerationResult {
  success: boolean
  article?: {
    title: string
    content: string
    excerpt: string
    seoTitle: string
    seoDescription: string
    tags: string[]
    category: string
    coverImage?: string // Base64 encoded
    coverImageMimeType?: string
  }
  error?: string
}

// ==================== Image Generation ====================

/**
 * Generate an image using Nano Banana (Gemini)
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  try {
    const ai = getAIClient()
    const model = options.model || "gemini-2.5-flash-image"

    // Build the prompt with style guidance
    let enhancedPrompt = options.prompt
    if (options.style) {
      const stylePrompts: Record<string, string> = {
        photorealistic: "Create a photorealistic, high-quality photograph of",
        "digital-art": "Create a vibrant digital art illustration of",
        illustration: "Create a clean, professional illustration of",
        "3d-render": "Create a 3D rendered visualization of",
      }
      enhancedPrompt = `${stylePrompts[options.style]} ${options.prompt}`
    }

    const response = await ai.models.generateContent({
      model,
      contents: enhancedPrompt,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: options.aspectRatio || "16:9",
        },
      },
    })

    // Extract image from response
    const candidate = response.candidates?.[0]
    if (!candidate?.content?.parts) {
      return { success: false, error: "No image generated" }
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return {
          success: true,
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        }
      }
    }

    return { success: false, error: "No image data in response" }
  } catch (error) {
    console.error("Image generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate image",
    }
  }
}

// ==================== Content Generation ====================

/**
 * Generate article content using Gemini
 */
export async function generateContent(
  options: ContentGenerationOptions
): Promise<ContentGenerationResult> {
  try {
    const ai = getAIClient()

    // Build the content generation prompt
    const toneGuide: Record<string, string> = {
      professional: "Use a professional, authoritative tone suitable for business readers.",
      casual: "Use a friendly, conversational tone that's easy to read.",
      educational: "Use an educational, explanatory tone with clear examples.",
      technical: "Use a technical, detailed tone with accurate terminology.",
    }

    const lengthGuide: Record<string, string> = {
      short: "Keep the article concise, around 500-800 words.",
      medium: "Write a comprehensive article of 1000-1500 words.",
      long: "Write an in-depth article of 2000-3000 words with detailed sections.",
    }

    const locale = options.locale || "en"
    const languageInstruction = locale !== "en"
      ? `Write the entire article in ${getLanguageName(locale)}.`
      : "Write in English."

    const prompt = `
You are an expert content writer specializing in cybersecurity, ethical hacking, and IT certifications.

Write a comprehensive blog article about: "${options.topic}"

${options.keywords?.length ? `Include these keywords naturally: ${options.keywords.join(", ")}` : ""}

${toneGuide[options.tone || "professional"]}
${lengthGuide[options.length || "medium"]}
${languageInstruction}

The article should:
- Have a compelling, SEO-optimized title
- Include an engaging introduction that hooks the reader
- Have clear sections with H2 and H3 headings
- Include practical tips or actionable advice
- Have a strong conclusion with a call-to-action
- Be formatted in Markdown

Please respond in the following JSON format:
{
  "title": "The article title",
  "content": "The full article content in Markdown format",
  "excerpt": "A compelling 150-200 character excerpt/summary",
  "seoTitle": "SEO-optimized title (max 60 characters)",
  "seoDescription": "SEO meta description (max 160 characters)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "The most appropriate category"
}

Respond ONLY with valid JSON, no additional text.
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    })

    const text = response.text
    if (!text) {
      return { success: false, error: "No content generated" }
    }

    // Parse the JSON response
    const parsed = JSON.parse(text)

    return {
      success: true,
      title: parsed.title,
      content: parsed.content,
      excerpt: parsed.excerpt,
      seoTitle: parsed.seoTitle,
      seoDescription: parsed.seoDescription,
      tags: parsed.tags || [],
      category: parsed.category || "cybersecurity",
    }
  } catch (error) {
    console.error("Content generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate content",
    }
  }
}

// ==================== Autoblog Generation ====================

/**
 * Generate a complete blog article with optional cover image
 */
export async function generateAutoblogArticle(
  options: AutoblogGenerationOptions
): Promise<AutoblogGenerationResult> {
  try {
    // Step 1: Generate the article content
    const contentResult = await generateContent({
      topic: options.topic,
      keywords: options.keywords,
      tone: options.tone,
      length: options.length,
      locale: options.locale,
      includeExcerpt: true,
      includeSeoMeta: true,
    })

    if (!contentResult.success || !contentResult.content) {
      return {
        success: false,
        error: contentResult.error || "Failed to generate article content",
      }
    }

    // Step 2: Generate cover image if requested
    let coverImage: string | undefined
    let coverImageMimeType: string | undefined

    if (options.generateImage) {
      const imagePrompt = `A professional, visually striking cover image for a blog article about: ${contentResult.title || options.topic}. The image should be modern, clean, and suitable for a cybersecurity/tech blog. Include relevant visual elements related to ${options.keywords?.join(", ") || options.topic}.`

      const imageResult = await generateImage({
        prompt: imagePrompt,
        aspectRatio: "16:9",
        style: options.imageStyle || "digital-art",
        model: "gemini-2.5-flash-image",
      })

      if (imageResult.success && imageResult.imageData) {
        coverImage = imageResult.imageData
        coverImageMimeType = imageResult.mimeType
      }
      // Don't fail if image generation fails, just continue without image
    }

    return {
      success: true,
      article: {
        title: contentResult.title!,
        content: contentResult.content,
        excerpt: contentResult.excerpt || "",
        seoTitle: contentResult.seoTitle || contentResult.title!,
        seoDescription: contentResult.seoDescription || contentResult.excerpt || "",
        tags: contentResult.tags || [],
        category: options.category || contentResult.category || "cybersecurity",
        coverImage,
        coverImageMimeType,
      },
    }
  } catch (error) {
    console.error("Autoblog generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate article",
    }
  }
}

// ==================== Helpers ====================

function getLanguageName(locale: string): string {
  const languages: Record<string, string> = {
    en: "English",
    fr: "French",
    es: "Spanish",
    de: "German",
    it: "Italian",
    nl: "Dutch",
    ar: "Arabic",
    cz: "Czech",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Chinese",
    ko: "Korean",
  }
  return languages[locale] || "English"
}

// ==================== Keyword-Based Generation ====================

export interface KeywordContentOptions {
  keyword: string
  impressions?: number
  currentPosition?: number
  category?: string
  locale?: string
  generateImage?: boolean
  imageStyle?: ImageGenerationOptions["style"]
  tone?: ContentGenerationOptions["tone"]
  length?: ContentGenerationOptions["length"]
}

export interface KeywordContentResult {
  success: boolean
  keyword: string
  article?: {
    title: string
    slug: string
    content: string
    excerpt: string
    seoTitle: string
    seoDescription: string
    tags: string[]
    category: string
    coverImage?: string
    coverImageMimeType?: string
  }
  error?: string
}

/**
 * Generate content optimized for a specific keyword from Search Console
 */
export async function generateKeywordContent(
  options: KeywordContentOptions
): Promise<KeywordContentResult> {
  try {
    const ai = getAIClient()

    const toneGuide: Record<string, string> = {
      professional: "Use a professional, authoritative tone suitable for business readers.",
      casual: "Use a friendly, conversational tone that's easy to read.",
      educational: "Use an educational, explanatory tone with clear examples.",
      technical: "Use a technical, detailed tone with accurate terminology.",
    }

    const lengthGuide: Record<string, string> = {
      short: "Keep the article concise, around 500-800 words.",
      medium: "Write a comprehensive article of 1000-1500 words.",
      long: "Write an in-depth article of 2000-3000 words with detailed sections.",
    }

    const locale = options.locale || "en"
    const languageInstruction = locale !== "en"
      ? `Write the entire article in ${getLanguageName(locale)}.`
      : "Write in English."

    // SEO-focused prompt for keyword targeting
    const prompt = `
You are an expert SEO content writer specializing in cybersecurity, ethical hacking, and IT certifications (especially CEH - Certified Ethical Hacker).

Your task is to write a highly SEO-optimized blog article targeting this specific keyword: "${options.keyword}"

${options.impressions ? `This keyword gets approximately ${options.impressions} impressions per month on Google.` : ""}
${options.currentPosition ? `We currently rank at position ${options.currentPosition} for this keyword.` : "We don't have content ranking for this keyword yet."}

${toneGuide[options.tone || "educational"]}
${lengthGuide[options.length || "medium"]}
${languageInstruction}

SEO Requirements:
- The title MUST include the exact keyword "${options.keyword}" naturally
- Use the keyword in the first 100 words
- Include the keyword in at least one H2 heading
- Use related/semantic keywords throughout
- Write content that fully answers the search intent behind "${options.keyword}"
- Include practical, actionable information
- Format for featured snippets where appropriate (lists, definitions, steps)

The article should:
- Have a compelling, click-worthy title that includes the target keyword
- Include an engaging introduction that hooks the reader
- Have clear sections with H2 and H3 headings (use the keyword in headings)
- Include practical tips, examples, or step-by-step guides
- Answer common questions related to the keyword
- Have a strong conclusion with a call-to-action
- Be formatted in Markdown

Please respond in the following JSON format:
{
  "title": "The article title (must include the keyword)",
  "slug": "url-friendly-slug-based-on-keyword",
  "content": "The full article content in Markdown format",
  "excerpt": "A compelling 150-200 character excerpt that includes the keyword",
  "seoTitle": "SEO-optimized title including keyword (max 60 characters)",
  "seoDescription": "SEO meta description including keyword (max 160 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "The most appropriate category",
  "relatedKeywords": ["related keyword 1", "related keyword 2"]
}

Respond ONLY with valid JSON, no additional text.
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    })

    const text = response.text
    if (!text) {
      return { success: false, keyword: options.keyword, error: "No content generated" }
    }

    const parsed = JSON.parse(text)

    // Generate cover image if requested
    let coverImage: string | undefined
    let coverImageMimeType: string | undefined

    if (options.generateImage) {
      const imagePrompt = `A professional, visually striking cover image for a blog article about: ${parsed.title}. The image should be modern, clean, and suitable for a cybersecurity/tech blog about ${options.keyword}. Include relevant visual elements.`

      const imageResult = await generateImage({
        prompt: imagePrompt,
        aspectRatio: "16:9",
        style: options.imageStyle || "digital-art",
        model: "gemini-2.5-flash-image",
      })

      if (imageResult.success && imageResult.imageData) {
        coverImage = imageResult.imageData
        coverImageMimeType = imageResult.mimeType
      }
    }

    return {
      success: true,
      keyword: options.keyword,
      article: {
        title: parsed.title,
        slug: parsed.slug || generateSlug(parsed.title),
        content: parsed.content,
        excerpt: parsed.excerpt || "",
        seoTitle: parsed.seoTitle || parsed.title,
        seoDescription: parsed.seoDescription || parsed.excerpt || "",
        tags: [...(parsed.tags || []), ...(parsed.relatedKeywords || [])].slice(0, 10),
        category: options.category || parsed.category || "cybersecurity",
        coverImage,
        coverImageMimeType,
      },
    }
  } catch (error) {
    console.error("Keyword content generation error:", error)
    return {
      success: false,
      keyword: options.keyword,
      error: error instanceof Error ? error.message : "Failed to generate content",
    }
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80)
}

/**
 * Generate content for multiple keywords from Search Console
 */
export async function generateKeywordContentBatch(
  keywords: KeywordContentOptions[],
  delayBetweenMs: number = 2000
): Promise<{
  success: boolean
  results: KeywordContentResult[]
  successCount: number
  failureCount: number
}> {
  const results: KeywordContentResult[] = []
  let successCount = 0
  let failureCount = 0

  for (let i = 0; i < keywords.length; i++) {
    const result = await generateKeywordContent(keywords[i])
    results.push(result)

    if (result.success) {
      successCount++
    } else {
      failureCount++
    }

    // Add delay between requests
    if (i < keywords.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs))
    }
  }

  return {
    success: failureCount === 0,
    results,
    successCount,
    failureCount,
  }
}

// ==================== Batch Generation ====================

export interface BatchGenerationOptions {
  topics: string[]
  category?: string
  locale?: string
  generateImages?: boolean
  imageStyle?: ImageGenerationOptions["style"]
  tone?: ContentGenerationOptions["tone"]
  length?: ContentGenerationOptions["length"]
  delayBetweenMs?: number
}

export interface BatchGenerationResult {
  success: boolean
  articles: AutoblogGenerationResult[]
  successCount: number
  failureCount: number
}

/**
 * Generate multiple articles in batch
 */
export async function generateBatchArticles(
  options: BatchGenerationOptions
): Promise<BatchGenerationResult> {
  const results: AutoblogGenerationResult[] = []
  let successCount = 0
  let failureCount = 0

  for (const topic of options.topics) {
    const result = await generateAutoblogArticle({
      topic,
      category: options.category,
      locale: options.locale,
      generateImage: options.generateImages,
      imageStyle: options.imageStyle,
      tone: options.tone,
      length: options.length,
    })

    results.push(result)
    if (result.success) {
      successCount++
    } else {
      failureCount++
    }

    // Add delay between requests to avoid rate limiting
    if (options.delayBetweenMs && options.topics.indexOf(topic) < options.topics.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, options.delayBetweenMs))
    }
  }

  return {
    success: failureCount === 0,
    articles: results,
    successCount,
    failureCount,
  }
}
