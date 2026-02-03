const { IgApiClient } = require('instagram-private-api');
const fs = require('fs').promises;
const path = require('path');

class InstagramAnalyzer {
  constructor() {
    this.ig = new IgApiClient();
    this.isLoggedIn = false;
    this.sessionPath = path.join(__dirname, '../../.instagram-session.json');
  }

  async login(username, password) {
    if (this.isLoggedIn) return;

    try {
      // Try to restore session first
      const restored = await this.restoreSession();
      if (restored) {
        this.isLoggedIn = true;
        console.log('✅ Instagram Session Restored!');
        return;
      }

      // If no session, login normally
      this.ig.state.generateDevice(username);
      await this.ig.simulate.preLoginFlow();
      await this.ig.account.login(username, password);
      await this.ig.simulate.postLoginFlow();

      // Save session for future use
      await this.saveSession();

      this.isLoggedIn = true;
      console.log('✅ Instagram Logged in and session saved!');
    } catch (error) {
      console.error('❌ Login Failed:', error.message);
      throw error;
    }
  }

  async saveSession() {
    try {
      const state = await this.ig.state.serialize();
      delete state.constants;
      await fs.writeFile(this.sessionPath, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save session:', error.message);
    }
  }

  async restoreSession() {
    try {
      const sessionData = await fs.readFile(this.sessionPath, 'utf-8');
      await this.ig.state.deserialize(sessionData);
      return true;
    } catch (error) {
      // No session file exists or corrupted
      return false;
    }
  }

  async getHashtagInfo(hashtag) {
    try {
      // Method 1: Try to get hashtag info directly
      const info = await this.ig.hashtag.info(hashtag);
      return {
        id: info.id,
        name: info.name,
        mediaCount: info.media_count || 0,
      };
    } catch (error) {
      console.log('Direct hashtag info failed, using feed method');
      // Method 2: Fallback to feed-based estimation
      try {
        const hashtagFeed = this.ig.feed.tag(hashtag);
        const firstPage = await hashtagFeed.items();

        return {
          id: hashtag,
          name: hashtag,
          mediaCount: firstPage.length > 0 ? 10000 : 0, // Approximate
        };
      } catch (feedError) {
        console.error('Both methods failed:', feedError.message);
        return {
          id: hashtag,
          name: hashtag,
          mediaCount: 0,
        };
      }
    }
  }

  async getRelatedHashtags(hashtag, limit = 10) {
    try {
      // FIXED: Use the correct method - ig.search.searchHashtag()
      const results = await this.ig.search.searchHashtag(hashtag);

      if (!results || results.length === 0) {
        console.log(`No related hashtags found for: ${hashtag}`);
        return [];
      }

      return results.slice(0, limit).map(tag => ({
        id: tag.id,
        name: tag.name,
        mediaCount: tag.media_count || 0
      }));
    } catch (error) {
      console.error('Failed to get related hashtags:', error.message);

      // Fallback: Extract hashtags from posts
      try {
        console.log('Trying fallback method: extracting from posts...');
        return await this.extractHashtagsFromPosts(hashtag, limit);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
        return [];
      }
    }
  }

  /**
   * Fallback method: Extract related hashtags from posts
   */
  async extractHashtagsFromPosts(hashtag, limit = 10) {
    try {
      const hashtagFeed = this.ig.feed.tag(hashtag);
      const posts = await hashtagFeed.items();

      const hashtagCount = new Map();

      // Extract hashtags from captions
      posts.slice(0, 30).forEach(post => {
        const caption = post.caption?.text || '';
        const tags = caption.match(/#[\w가-힣]+/g) || [];

        tags.forEach(tag => {
          const cleanTag = tag.substring(1).toLowerCase();
          if (cleanTag !== hashtag.toLowerCase()) {
            hashtagCount.set(cleanTag, (hashtagCount.get(cleanTag) || 0) + 1);
          }
        });
      });

      // Sort by frequency and return top results
      return Array.from(hashtagCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({
          id: name,
          name: name,
          mediaCount: count * 100 // Rough estimate
        }));
    } catch (error) {
      console.error('Extraction from posts failed:', error.message);
      return [];
    }
  }

  async getHashtagPosts(hashtag, limit = 10) {
    try {
      const hashtagFeed = this.ig.feed.tag(hashtag);
      const posts = await hashtagFeed.items();

      return posts.slice(0, limit).map(post => ({
        id: post.id,
        code: post.code,
        url: `https://www.instagram.com/p/${post.code}/`,
        likes: post.like_count || 0,
        comments: post.comment_count || 0,
        timestamp: new Date(post.taken_at * 1000).toISOString(),
      }));
    } catch (error) {
      console.error('Failed to get hashtag posts:', error.message);
      return [];
    }
  }

  async getWeeklyHistory(hashtag, maxPosts = 100) {
    try {
      const hashtagFeed = this.ig.feed.tag(hashtag);
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      let allPosts = [];
      let posts = [];
      let fetchCount = 0;
      const maxFetches = 5; // Prevent infinite loops

      do {
        posts = await hashtagFeed.items();
        fetchCount++;

        for (const post of posts) {
          const postDate = post.taken_at * 1000;
          if (postDate >= oneWeekAgo) {
            allPosts.push({
              likes: post.like_count || 0,
              comments: post.comment_count || 0,
              date: new Date(postDate).toISOString().slice(0, 10), // YYYY-MM-DD
            });
          } else {
            // Found post older than 1 week, stop fetching
            posts = [];
            break;
          }
        }

        if (allPosts.length >= maxPosts) break;
        if (fetchCount >= maxFetches) break;

      } while (hashtagFeed.isMoreAvailable() && posts.length > 0);

      // Group by date
      const grouped = {};
      allPosts.forEach(post => {
        const date = post.date;
        if (!grouped[date]) {
          grouped[date] = {
            date: date,
            count: 0,
            totalLikes: 0,
            totalComments: 0
          };
        }
        grouped[date].count++;
        grouped[date].totalLikes += post.likes;
        grouped[date].totalComments += post.comments;
      });

      return {
        totalPosts: allPosts.length,
        dailyStats: Object.values(grouped).sort((a, b) =>
          new Date(b.date) - new Date(a.date)
        )
      };
    } catch (error) {
      console.error('Failed to get weekly history:', error.message);
      return {
        totalPosts: 0,
        dailyStats: []
      };
    }
  }
}

const analyzer = new InstagramAnalyzer();

function formatInstagramStyle(num) {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

const getInstagramInfo = async function scrapingInstagramSocialInfo(word) {
  try {
    const USERNAME = process.env.INSTAGRAM_USERNAME;
    const PASSWORD = process.env.INSTAGRAM_PASSWORD;

    if (!USERNAME || !PASSWORD) {
      console.error("❌ Missing INSTAGRAM_USERNAME or INSTAGRAM_PASSWORD in .env");
      return null;
    }

    console.log(`📱 Analyzing hashtag: #${word}`);

    // Login
    await analyzer.login(USERNAME, PASSWORD);

    // Run parallel for efficiency with error handling
    const [info, related, history] = await Promise.allSettled([
      analyzer.getHashtagInfo(word),
      analyzer.getRelatedHashtags(word, 3),
      analyzer.getWeeklyHistory(word, 100)
    ]);

    // Extract results or use defaults
    const hashtagInfo = info.status === 'fulfilled' ? info.value : {
      id: word,
      name: word,
      mediaCount: 0
    };

    const relatedTags = related.status === 'fulfilled' ? related.value : [];

    const weeklyHistory = history.status === 'fulfilled' ? history.value : {
      totalPosts: 0,
      dailyStats: []
    };

    // Format for frontend
    const trendData = weeklyHistory.dailyStats.map(s => ({
      date: s.date,
      posts: s.count
    }));

    const topTags = relatedTags;

    // Calculate percentage change (if we have enough data)
    let percentageChange = "0%";
    if (trendData.length >= 2) {
      const latest = trendData[0].posts;
      const previous = trendData[1].posts;
      if (previous > 0) {
        const change = ((latest - previous) / previous * 100).toFixed(1);
        percentageChange = change > 0 ? `+${change}%` : `${change}%`;
      }
    }

    const formattedNum = formatInstagramStyle(hashtagInfo.mediaCount);
    const tagInfo = [formattedNum, percentageChange];

    console.log(`✅ Analysis complete: ${formattedNum} posts, ${relatedTags.length} related tags`);

    return {
      id: word,
      trendData,
      topTags,
      tagInfo
    };

  } catch (error) {
    console.error("❌ Error in instagramInfo function:", error.message);
    console.error("Full error:", error);

    // Return minimal data instead of null to prevent crashes
    return {
      id: word,
      trendData: [],
      topTags: [],
      tagInfo: ["0", "0%"]
    };
  }
};

module.exports = { getInstagramInfo };