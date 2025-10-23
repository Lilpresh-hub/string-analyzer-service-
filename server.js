const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// MongoDB Schema
const stringSchema = new mongoose.Schema({
  _id: String, // SHA-256 hash as ID
  value: { type: String, required: true, unique: true },
  properties: {
    length: Number,
    is_palindrome: Boolean,
    unique_characters: Number,
    word_count: Number,
    sha256_hash: String,
    character_frequency_map: Object
  },
  created_at: { type: Date, default: Date.now }
});

const StringModel = mongoose.model('String', stringSchema);

// Helper Functions
function computeProperties(str) {
  const sha256 = crypto.createHash('sha256').update(str).digest('hex');
  const normalized = str.toLowerCase().replace(/\s/g, '');
  const isPalindrome = normalized === normalized.split('').reverse().join('');
  const uniqueChars = new Set(str).size;
  const wordCount = str.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  const charFreqMap = {};
  for (const char of str) {
    charFreqMap[char] = (charFreqMap[char] || 0) + 1;
  }

  return {
    length: str.length,
    is_palindrome: isPalindrome,
    unique_characters: uniqueChars,
    word_count: wordCount,
    sha256_hash: sha256,
    character_frequency_map: charFreqMap
  };
}

function parseNaturalLanguage(query) {
  const filters = {};
  const lowerQuery = query.toLowerCase();

  // Word count patterns
  if (lowerQuery.includes('single word')) {
    filters.word_count = 1;
  } else {
    const wordCountMatch = lowerQuery.match(/(\d+)\s+word/);
    if (wordCountMatch) {
      filters.word_count = parseInt(wordCountMatch[1]);
    }
  }

  // Palindrome
  if (lowerQuery.includes('palindrom')) {
    filters.is_palindrome = true;
  }

  // Length patterns
  const longerMatch = lowerQuery.match(/longer than (\d+)/);
  if (longerMatch) {
    filters.min_length = parseInt(longerMatch[1]) + 1;
  }

  const shorterMatch = lowerQuery.match(/shorter than (\d+)/);
  if (shorterMatch) {
    filters.max_length = parseInt(shorterMatch[1]) - 1;
  }

  // Character contains
  const containsMatch = lowerQuery.match(/contain(?:ing|s)?\s+(?:the\s+)?(?:letter\s+)?([a-z])/);
  if (containsMatch) {
    filters.contains_character = containsMatch[1];
  }

  // First vowel detection
  if (lowerQuery.includes('first vowel')) {
    filters.contains_character = 'a';
  }

  return filters;
}

// Routes

// 1. Create/Analyze String
app.post('/strings', async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Missing "value" field in request body' });
    }

    if (typeof value !== 'string') {
      return res.status(422).json({ error: 'Invalid data type for "value" (must be string)' });
    }

    const properties = computeProperties(value);
    const sha256Hash = properties.sha256_hash;

    // Check if already exists
    const existing = await StringModel.findById(sha256Hash);
    if (existing) {
      return res.status(409).json({ error: 'String already exists in the system' });
    }

    const newString = new StringModel({
      _id: sha256Hash,
      value,
      properties
    });

    await newString.save();

    res.status(201).json({
      id: sha256Hash,
      value: newString.value,
      properties: newString.properties,
      created_at: newString.created_at.toISOString()
    });
  } catch (error) {
    console.error('Error creating string:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get Specific String
app.get('/strings/:string_value', async (req, res) => {
  try {
    const { string_value } = req.params;
    const decodedValue = decodeURIComponent(string_value);

    const stringDoc = await StringModel.findOne({ value: decodedValue });

    if (!stringDoc) {
      return res.status(404).json({ error: 'String does not exist in the system' });
    }

    res.status(200).json({
      id: stringDoc._id,
      value: stringDoc.value,
      properties: stringDoc.properties,
      created_at: stringDoc.created_at.toISOString()
    });
  } catch (error) {
    console.error('Error fetching string:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get All Strings with Filtering
app.get('/strings', async (req, res) => {
  try {
    const {
      is_palindrome,
      min_length,
      max_length,
      word_count,
      contains_character
    } = req.query;

    const query = {};
    const filtersApplied = {};

    if (is_palindrome !== undefined) {
      const isPalin = is_palindrome === 'true';
      query['properties.is_palindrome'] = isPalin;
      filtersApplied.is_palindrome = isPalin;
    }

    if (min_length !== undefined) {
      const minLen = parseInt(min_length);
      if (isNaN(minLen)) {
        return res.status(400).json({ error: 'Invalid value for min_length' });
      }
      query['properties.length'] = { ...query['properties.length'], $gte: minLen };
      filtersApplied.min_length = minLen;
    }

    if (max_length !== undefined) {
      const maxLen = parseInt(max_length);
      if (isNaN(maxLen)) {
        return res.status(400).json({ error: 'Invalid value for max_length' });
      }
      query['properties.length'] = { ...query['properties.length'], $lte: maxLen };
      filtersApplied.max_length = maxLen;
    }

    if (word_count !== undefined) {
      const wc = parseInt(word_count);
      if (isNaN(wc)) {
        return res.status(400).json({ error: 'Invalid value for word_count' });
      }
      query['properties.word_count'] = wc;
      filtersApplied.word_count = wc;
    }

    if (contains_character !== undefined) {
      if (typeof contains_character !== 'string' || contains_character.length !== 1) {
        return res.status(400).json({ error: 'contains_character must be a single character' });
      }
      query[`properties.character_frequency_map.${contains_character}`] = { $exists: true, $gte: 1 };
      filtersApplied.contains_character = contains_character;
    }

    const results = await StringModel.find(query).sort({ created_at: -1 });

    const data = results.map(doc => ({
      id: doc._id,
      value: doc.value,
      properties: doc.properties,
      created_at: doc.created_at.toISOString()
    }));

    res.status(200).json({
      data,
      count: data.length,
      filters_applied: filtersApplied
    });
  } catch (error) {
    console.error('Error filtering strings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Natural Language Filtering
app.get('/strings/filter-by-natural-language', async (req, res) => {
  try {
    const { query: nlQuery } = req.query;

    if (!nlQuery) {
      return res.status(400).json({ error: 'Missing "query" parameter' });
    }

    const parsedFilters = parseNaturalLanguage(nlQuery);

    if (Object.keys(parsedFilters).length === 0) {
      return res.status(400).json({ error: 'Unable to parse natural language query' });
    }

    // Build MongoDB query
    const dbQuery = {};
    if (parsedFilters.is_palindrome !== undefined) {
      dbQuery['properties.is_palindrome'] = parsedFilters.is_palindrome;
    }
    if (parsedFilters.word_count !== undefined) {
      dbQuery['properties.word_count'] = parsedFilters.word_count;
    }
    if (parsedFilters.min_length !== undefined) {
      dbQuery['properties.length'] = { ...dbQuery['properties.length'], $gte: parsedFilters.min_length };
    }
    if (parsedFilters.max_length !== undefined) {
      dbQuery['properties.length'] = { ...dbQuery['properties.length'], $lte: parsedFilters.max_length };
    }
    if (parsedFilters.contains_character !== undefined) {
      dbQuery[`properties.character_frequency_map.${parsedFilters.contains_character}`] = { $exists: true, $gte: 1 };
    }

    const results = await StringModel.find(dbQuery).sort({ created_at: -1 });

    const data = results.map(doc => ({
      id: doc._id,
      value: doc.value,
      properties: doc.properties,
      created_at: doc.created_at.toISOString()
    }));

    res.status(200).json({
      data,
      count: data.length,
      interpreted_query: {
        original: nlQuery,
        parsed_filters: parsedFilters
      }
    });
  } catch (error) {
    console.error('Error in natural language filtering:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Delete String
app.delete('/strings/:string_value', async (req, res) => {
  try {
    const { string_value } = req.params;
    const decodedValue = decodeURIComponent(string_value);

    const result = await StringModel.findOneAndDelete({ value: decodedValue });

    if (!result) {
      return res.status(404).json({ error: 'String does not exist in the system' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting string:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
