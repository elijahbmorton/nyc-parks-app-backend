const express = require("express");
const { Op } = require('sequelize');

const auth = require("../middleware/auth");

const Park = require("../models/park");
const Review = require("../models/review");

const searchRouter = express.Router();

const PARTIAL_MATCH_MULTIPLIER = 0.4;

const searchHierarchy = {
    // Parks columns
    'NAME311': {
        points: 10,
        partialMatch: true,
    },
    'LOCATION': {
        points: 5,
        partialMatch: true,
    },
    'BOROUGH': {
        points: 3,
        partialMatch: false,
    },
    'CLASS': {
        points: 2,
        partialMatch: false,
    },
    'SIGNNAME': {
        points: 10,
        partialMatch: true,
    },
    'SUBCATEGORY': {
        points: 3,
        partialMatch: true,
    },
    'TYPECATEGORY': {
        points: 3,
        partialMatch: true,
    },
    'ZIPCODE': {
        points: 4,
        partialMatch: false,
    },

    // Reviews columns
    'comments': {
        points: 1,
        partialMatch: true,
        pointsForLoggedInUser: 5,
    },
};

const fakeMiddleware = (req, res, next) => {
    next();
};

// Function rewritten by Claude Sonnet 4.5 to be more efficient
// Also cause sequelize data structs are confusing
const joinParksAndReviews = (parks, reviews) => {
    // Convert Sequelize instances to plain objects
    const parksJSON = parks.map(park => park.toJSON());
    const reviewsJSON = reviews.map(review => review.toJSON());

    // Join parks with their reviews
    const parksWithReviews = parksJSON.map(park => ({
        ...park,
        matchingReviews: reviewsJSON.filter(review => review.parkId === park.GlobalID)
    }));

    // Add standalone reviews (reviews that matched search but park didn't)
    const parkIds = new Set(parksJSON.map(p => p.GlobalID));
    const standaloneReviews = reviewsJSON
        .filter(review => !parkIds.has(review.parkId))
        .map(review => ({ type: 'review', ...review }));

    const joinedParksAndReviews = [...parksWithReviews, ...standaloneReviews];

    return joinedParksAndReviews;
};

const pullParksAndReviews = async (searchWords) => {
    // Columns to search in
    const parkSearchColumns = ['NAME311', 'LOCATION', 'BOROUGH', 'CLASS', 'SIGNNAME', 'SUBCATEGORY', 'TYPECATEGORY', 'ZIPCODE'];

    // Build OR conditions: for each word, search across all columns
    // Handle partial match based on searchHierarchy
    const parkOrConditions = searchWords.flatMap(word => 
        parkSearchColumns.map(column => {
            const isPartialMatch = searchHierarchy[column]?.partialMatch;
            return {
                [column]: {
                    [Op.like]: isPartialMatch ? `%${word}%` : `${word}`
                }
            };
        })
    );

    // Find parks where any word matches any column
    async function fetchParks() {
        return Park.findAll({ 
            attributes: ['GlobalID', 'NAME311', 'LOCATION', 'BOROUGH', 'CLASS', 
                'SIGNNAME', 'SUBCATEGORY', 'TYPECATEGORY', 'ZIPCODE'],
            where: {
                [Op.or]: parkOrConditions
            },
        });
    };

    const reviewOrConditions = searchWords.map(word => ({
        'comments': {
            [Op.like]: `%${word}%` // Partial match anywhere in comments
        }
    }));

    async function fetchReviews() { 
        return Review.findAll({
            where: {
                [Op.or]: reviewOrConditions
            },
        });
    };


    let [parks, reviews] = await Promise.all([fetchParks(), fetchReviews()]);

    return joinParksAndReviews(parks, reviews);
}

const filterSearchResults = (searchWords, searchResults, loggedInUserId) => {
    searchResults.forEach(result => {
        result.points = 0;
        searchWords.forEach(word => {
            // Skip "Park"
            if (word.toLowerCase() == "park") {
                return;
            }
            Object.entries(searchHierarchy).forEach(([columnKey, hierarchyInfo]) => {
                // If the column is in the result
                if (Object.keys(result).includes(columnKey)) {
                    // if (word.toLowerCase() == "park" && columnKey == "NAME311" || columnKey == "SIGNNAME") {
                    //     // Many parks have "Park" in the name
                    //     return;
                    // }
                    // If the column is a total match
                    if (result[columnKey] == word) {
                        // TODO: More points for quoted phrases that match
                        result.points += hierarchyInfo.points;
                    }
                    // If the column is a partial match (and partial match is allowed)
                    else if (hierarchyInfo.partialMatch && result[columnKey].toLowerCase().includes(word.toLowerCase())) {
                        // Add appropriate points to the result (can adjust multiplier)
                        result.points += (hierarchyInfo.points * PARTIAL_MATCH_MULTIPLIER);
                    }
                }
            });
            // Matching reviews
            if (Object.keys(result).includes('matchingReviews')) {
                result.matchingReviews.forEach(review => {
                    searchWords.forEach(word => {
                        // Full matches don't actually matter here
                        if (review.comments.toLowerCase().includes(word.toLowerCase())) {
                            if (loggedInUserId && review.userId == loggedInUserId) {
                                // More importance placed on the logged in user's own reviews
                                result.points += searchHierarchy.comments.pointsForLoggedInUser;
                            } else {
                                result.points += searchHierarchy.comments.points;
                            }
                        }
                    });
                });
            };
        });
    });

    // Sort the search results by points
    searchResults.sort((a, b) => b.points - a.points);

    return searchResults;
}

searchRouter.get("/", fakeMiddleware, async (req, res) => {
    try {
        const { query, loggedInUserId } = req.query;

        // If no query provided
        if (!query || query.trim() == '') {
            // I'm a teapot
            return res.status(418).json([]);
        }

        // Split search query into words and filter out empty strings
        const searchWords = query.trim()
            .match(/"[^"]+"|\S+/g) // Match quoted phrases or words
            ?.map(word => word.replace(/^"|"$/g, '')) // Remove quotes from phrases
            .filter(word => word.length > 0) || [];

        console.log('search words and phrases:', searchWords);

        const sqlSearchResults = await pullParksAndReviews(searchWords);

        const filteredSearchResults = filterSearchResults(searchWords, sqlSearchResults, loggedInUserId);

        console.log('filtered search results:', filteredSearchResults);

        return res.status(200).json(filteredSearchResults);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: "Failed to search parks." });
    }
});



module.exports = searchRouter;