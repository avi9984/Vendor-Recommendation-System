import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiErros.js";

// Helper function to calculate distance in km between two locations
const getDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return 999;
    if (loc1.toLowerCase().trim() === loc2.toLowerCase().trim()) return 0;
    
    // Try to parse coordinates: e.g. "12.9715987, 77.5945627"
    const coordRegex = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;
    const match1 = loc1.trim().match(coordRegex);
    const match2 = loc2.trim().match(coordRegex);
    
    if (match1 && match2) {
        const lat1 = parseFloat(match1[1]);
        const lon1 = parseFloat(match1[2]);
        const lat2 = parseFloat(match2[1]);
        const lon2 = parseFloat(match2[2]);
        
        // Haversine formula
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // Fallback: Default distance if strings don't match and aren't coordinates
    return 120; 
}

export const recommendVendors = async (workRequirementId) => {
    const work = await prisma.workRequirement.findUnique({
        where: {
            id: workRequirementId
        }
    });
    if (!work) {
        throw new ApiError(404, "Work not found");
    }

    const vendors = await prisma.vendor.findMany({
        where: {
            status: "ACTIVE",
        },
        include: { documents: true }
    });

    const scoring = vendors.map((vendor) => {
        let score = 0;
        const details = [];

        // 1. Category Match (40 pts)
        if (vendor.category.toLowerCase().trim() === work.category.toLowerCase().trim()) {
            score += 40;
            details.push("Category matches (" + work.category + "): +40");
        } else {
            details.push("Category mismatch (" + vendor.category + " vs " + work.category + "): +0");
        }

        // 2. Experience Check (30 pts max)
        if (vendor.establishmentYear) {
            const expDiff = new Date().getFullYear() - vendor.establishmentYear;
            if (expDiff >= 5) {
                score += 30;
                details.push("Experience >= 5 years (" + expDiff + " yrs): +30");
            } else if (expDiff >= 3) {
                score += 20;
                details.push("Experience >= 3 years (" + expDiff + " yrs): +20");
            } else if (expDiff >= 1) {
                score += 10;
                details.push("Experience >= 1 year (" + expDiff + " yrs): +10");
            } else {
                details.push("Experience < 1 year: +0");
            }
        } else {
            details.push("Establishment year not provided: +0");
        }

        // 3. Document Verification (30 pts max)
        const totalDocs = vendor.documents.length;
        const verifiedDocs = vendor.documents.filter(doc => doc.verified).length;
        const hasExpiredDocs = vendor.documents.some(doc => doc.expiryDate && new Date(doc.expiryDate) < new Date());
        
        if (totalDocs > 0 && verifiedDocs === totalDocs && !hasExpiredDocs) {
            score += 30;
            details.push("All documents (" + totalDocs + ") verified and active: +30");
        } else if (verifiedDocs > 0 && !hasExpiredDocs) {
            score += 15;
            details.push("Some documents (" + verifiedDocs + "/" + totalDocs + ") verified & none expired: +15");
        } else {
            details.push("Unverified or expired documents: +0");
        }

        // 4. Location Proximity (20 pts max)
        const distance = getDistance(vendor.location, work.location);
        if (distance <= 50) {
            score += 20;
            details.push("Location within 50km (" + Math.round(distance) + "km): +20");
        } else if (distance <= 100) {
            score += 10;
            details.push("Location within 100km (" + Math.round(distance) + "km): +10");
        } else {
            details.push("Location distance > 100km (" + Math.round(distance) + "km): +0");
        }

        // 5. Rating (50 pts max)
        if (vendor.rating > 0) {
            const ratingScore = vendor.rating * 10;
            score += ratingScore;
            details.push("Rating score (Rating: " + vendor.rating + "): +" + ratingScore);
        } else {
            details.push("No rating available: +0");
        }

        return {
            vendorId: vendor.id,
            name: vendor.vendorname,
            email: vendor.email,
            category: vendor.category,
            location: vendor.location,
            rating: vendor.rating,
            score,
            distance: Math.round(distance),
            totalDocuments: totalDocs,
            verifiedDocuments: verifiedDocs,
            scoringDetails: details
        };
    });

    // Sort vendors by score descending
    scoring.sort((a, b) => b.score - a.score);

    return scoring;
}


