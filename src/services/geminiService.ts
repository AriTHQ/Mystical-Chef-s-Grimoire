import { GoogleGenAI, Type } from "@google/genai";

const apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || (process.env.GEMINI_API_KEY as string) || "";
const ai = new GoogleGenAI({ apiKey });

export interface MagicalDish {
  dishName: string;
  ingredients: {
    magicalName: string;
    originalName: string;
    quantity: string;
    visualIcon: string; // Emoji or simple icon description
  }[];
  ritualSteps: string[];
  magicalEffect: {
    duration: string;
    description: string;
  };
}

export async function generateMagicalDish(ingredients: { name: string; quantity: string }[]): Promise<MagicalDish> {
  const ingredientsString = ingredients.map(ing => `${ing.quantity} ${ing.name}`).join(", ");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `你是一位魔法大厨。请将这些食材转化为一道魔法菜肴：${ingredientsString}`,
    config: {
      systemInstruction: `你是一位生活在魔法世界的神秘大厨，擅长将普通食材转化为充满魔力的神奇菜肴。
      
      请遵循以下准则：
      1. 魔法菜名：根据主要食材或成品效果，取一个富有魔幻色彩的名字。
      2. 食材魔幻化：为每种食材赋予一个独特的魔幻名称。
      3. 视觉图示：为每个魔幻食材提供一个最贴切的 Emoji 作为视觉图示 (visualIcon)。
      4. 烹饪步骤：设计3~5步魔法烹饪过程，将动作转化为魔法仪式。
      5. 魔法效果：随机生成食用后的增益效果，包括持续时间和具体属性。
      6. 输出格式：必须返回符合指定JSON架构的对象。`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dishName: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                magicalName: { type: Type.STRING },
                originalName: { type: Type.STRING },
                quantity: { type: Type.STRING },
                visualIcon: { type: Type.STRING, description: "一个代表该食材的 Emoji" }
              },
              required: ["magicalName", "originalName", "quantity", "visualIcon"]
            }
          },
          ritualSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          magicalEffect: {
            type: Type.OBJECT,
            properties: {
              duration: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["duration", "description"]
          }
        },
        required: ["dishName", "ingredients", "ritualSteps", "magicalEffect"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as MagicalDish;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("The magic failed to manifest. Try again.");
  }
}
