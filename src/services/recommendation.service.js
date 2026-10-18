import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiErros.js";

/**
 * Validates whether coordinates fall within valid geographic bounds.
 * Latitude must be [-90, 90], Longitude must be [-180, 180].
 */
const isValidCoordinate = (lat, lon) => {
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

/**
 * Calculates distance in kilometers between two locations.
 * Safely handles string locations, coordinate pairs, and invalid formats.
 */
export const getDistance = (loc1, loc2) => {
    if (!loc1 || !loc2 || typeof loc1 !== "string" || typeof loc2 !== "string") {
        return 999;
    }

    const trimmed1 = loc1.trim();
    const trimmed2 = loc2.trim();

    if (trimmed1.toLowerCase() === trimmed2.toLowerCase()) {
        return 0;
    }

    // Parse coordinates formatted like: "12.9715987, 77.5945627" or "12.9715,77.5945"
    const coordRegex = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;
    const match1 = trimmed1.match(coordRegex);
    const match2 = trimmed2.match(coordRegex);

    if (match1 && match2) {
        const lat1 = parseFloat(match1[1]);
        const lon1 = parseFloat(match1[2]);
        const lat2 = parseFloat(match2[1]);
        const lon2 = parseFloat(match2[2]);

        if (isValidCoordinate(lat1, lon1) && isValidCoordinate(lat2, lon2)) {
            const R = 6371; // Earth radius in km
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) *
                Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);

            // Clamp `a` to prevent NaN from floating point inaccuracies
            const clampedA = Math.min(1, Math.max(0, a));
            const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
            return Math.round((R * c) * 10) / 10;
        }
    }

    // Default distance fallback when textual locations don't match exactly and are not coordinate pairs
    return 120;
};

/**
 * Recommendation matching engine for a given work requirement.
 * Accepts either workRequirementId string or a pre-fetched workRequirement object to save database calls.
 */
export const recommendVendors = async (workRequirementOrId, options = {}) => {
    const { limit = 10, minScore = 0 } = options;

    let work = null;
    if (typeof workRequirementOrId === "string") {
        work = await prisma.workRequirement.findUnique({
            where: { id: workRequirementOrId }
        });
    } else if (workRequirementOrId && typeof workRequirementOrId === "object") {
        work = workRequirementOrId;
    }

    if (!work) {
        throw ApiError(404, "Work requirement not found");
    }

    // Fetch active vendors with only the necessary document fields projected
    const vendors = await prisma.vendor.findMany({
        where: {
            status: "ACTIVE"
        },
        select: {
            id: true,
            vendorname: true,
            email: true,
            category: true,
            location: true,
            rating: true,
            establishmentYear: true,
            documents: {
                select: {
                    id: true,
                    documentType: true,
                    verified: true,
                    expiryDate: true
                }
            }
        }
    });

    const currentYear = new Date().getFullYear();
    const now = new Date();

    const scoredVendors = vendors.map((vendor) => {
        let score = 0;
        const details = [];

        // 1. Category Match (Max 40 pts)
        const isCategoryMatch =
            vendor.category &&
            work.category &&
            vendor.category.trim().toLowerCase() === work.category.trim().toLowerCase();

        if (isCategoryMatch) {
            score += 40;
            details.push(`Category matches (${work.category}): +40`);
        } else {
            details.push(`Category mismatch (${vendor.category || "N/A"} vs ${work.category}): +0`);
        }

        // 2. Experience Check (Max 30 pts)
        if (vendor.establishmentYear && vendor.establishmentYear >= 1800 && vendor.establishmentYear <= currentYear) {
            const expDiff = Math.max(0, currentYear - vendor.establishmentYear);
            if (expDiff >= 5) {
                score += 30;
                details.push(`Experience >= 5 years (${expDiff} yrs): +30`);
            } else if (expDiff >= 3) {
                score += 20;
                details.push(`Experience >= 3 years (${expDiff} yrs): +20`);
            } else if (expDiff >= 1) {
                score += 10;
                details.push(`Experience >= 1 year (${expDiff} yrs): +10`);
            } else {
                details.push(`Experience < 1 year: +0`);
            }
        } else {
            details.push("Establishment year invalid or not provided: +0");
        }

        // 3. Document Compliance (Max 30 pts)
        const totalDocs = vendor.documents ? vendor.documents.length : 0;
        const verifiedDocs = vendor.documents ? vendor.documents.filter((doc) => doc.verified).length : 0;
        const hasExpiredDocs = vendor.documents
            ? vendor.documents.some((doc) => {
                  if (!doc.expiryDate) return false;
                  const exp = new Date(doc.expiryDate);
                  return !isNaN(exp.getTime()) && exp < now;
              })
            : false;

        if (totalDocs > 0 && verifiedDocs === totalDocs && !hasExpiredDocs) {
            score += 30;
            details.push(`All documents (${totalDocs}) verified and active: +30`);
        } else if (verifiedDocs > 0 && !hasExpiredDocs) {
            score += 15;
            details.push(`Some documents (${verifiedDocs}/${totalDocs}) verified & none expired: +15`);
        } else {
            details.push("Unverified, missing, or expired documents: +0");
        }

        // 4. Location Proximity (Max 20 pts)
        const distance = getDistance(vendor.location, work.location);
        if (distance <= 50) {
            score += 20;
            details.push(`Location within 50km (${distance}km): +20`);
        } else if (distance <= 100) {
            score += 10;
            details.push(`Location within 100km (${distance}km): +10`);
        } else {
            details.push(`Location distance > 100km (${distance}km): +0`);
        }

        // 5. Rating Multiplier (Max 50 pts)
        const safeRating = typeof vendor.rating === "number" ? Math.min(5, Math.max(0, vendor.rating)) : 0;
        if (safeRating > 0) {
            const ratingScore = Math.round(safeRating * 10 * 10) / 10;
            score += ratingScore;
            details.push(`Rating score (Rating: ${safeRating}/5.0): +${ratingScore}`);
        } else {
            details.push("No rating available: +0");
        }

        const maxPossibleScore = 170;
        const suitabilityPercentage = Math.round((score / maxPossibleScore) * 100);

        return {
            vendorId: vendor.id,
            name: vendor.vendorname,
            email: vendor.email,
            category: vendor.category,
            location: vendor.location,
            rating: safeRating,
            score: Math.round(score * 10) / 10,
            suitabilityPercentage,
            distance,
            totalDocuments: totalDocs,
            verifiedDocuments: verifiedDocs,
            hasExpiredDocs,
            scoringDetails: details
        };
    });

    // Sort descending by score, filter by minScore, and apply limit
    const filteredAndSorted = scoredVendors
        .filter((v) => v.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return filteredAndSorted;
};
