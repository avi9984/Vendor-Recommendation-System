import { GoogleGenerativeAI } from "@google/generative-ai";

const generateFallbackSummary = (work, recommendations) => {
    if (!recommendations || recommendations.length === 0) {
        return "No active vendors were found to recommend for this work requirement.";
    }
    const topVendor = recommendations[0];
    const topScore = topVendor.score;
    const categoryMatchText = topVendor.category.toLowerCase().trim() === work.category.toLowerCase().trim()
        ? `matches the category '${work.category}'`
        : `does not match the category '${work.category}'`;
    
    const docText = topVendor.totalDocuments > 0 && topVendor.verifiedDocuments === topVendor.totalDocuments
        ? `has all ${topVendor.totalDocuments} compliance documents verified and active`
        : `has ${topVendor.verifiedDocuments} of ${topVendor.totalDocuments} compliance documents verified`;

    let summary = `### Recommendation Summary (Rule-Based Fallback)\n`;
    summary += `We recommend **${topVendor.name}** as the most suitable vendor. They achieved a suitability score of **${topScore}/170**.\n\n`;
    summary += `**Key Strengths:**\n`;
    summary += `- **Category Match:** ${topVendor.name} ${categoryMatchText}.\n`;
    summary += `- **Compliance:** The vendor ${docText}.\n`;
    summary += `- **Proximity:** Located **${topVendor.distance}km** from the work site.\n`;
    summary += `- **Reputation:** Holds a rating of **${topVendor.rating}/5.0**.\n\n`;

    if (recommendations.length > 1) {
        summary += `### Vendor Comparison Table\n\n`;
        summary += `| Rank | Vendor Name | Category | Score | Distance | Rating | Verified Docs |\n`;
        summary += `|---|---|---|---|---|---|---|\n`;
        recommendations.slice(0, 3).forEach((v, index) => {
            summary += `| ${index + 1} | ${v.name} | ${v.category} | ${v.score} | ${v.distance}km | ${v.rating}/5.0 | ${v.verifiedDocuments}/${v.totalDocuments} |\n`;
        });
        summary += `\n`;
    }

    return summary;
}

export const generateRecommendationSummary = async (work, recommendations) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log("GEMINI_API_KEY is not configured. Using rule-based fallback summary.");
        return generateFallbackSummary(work, recommendations);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
You are an expert procurement and operations advisor. 
Generate a professional vendor recommendation and comparison summary based on the following work requirement and ranked vendor matching candidates.

Work Requirement:
- Title: ${work.title}
- Description: ${work.description || "N/A"}
- Category: ${work.category}
- Location: ${work.location}
- Estimated Value: $${work.estimatedValue}
- Priority: ${work.priority}

Ranked List of Recommended Vendors (highest score is best):
${JSON.stringify(recommendations.slice(0, 5), null, 2)}

In your response:
1. Provide a clear "Recommendation Summary" explaining why the top vendor is recommended. Highlight their strengths (score, location distance, category match, compliance documents verified, and rating).
2. Provide a "Vendor Comparison" section comparing the top 2-3 vendors.
3. Call out any compliance observation or risks (e.g., if a vendor has unverified documents or is far away).
Use clear, professional formatting with markdown headers, bold text, and lists. Do not use generic placeholders. Make it concise and actionable.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Failed to generate AI summary. Falling back to rule-based summary.", error);
        return generateFallbackSummary(work, recommendations);
    }
}
