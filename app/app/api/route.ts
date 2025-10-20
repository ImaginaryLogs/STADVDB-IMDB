import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log("Fetching data from MySQL database...");

    // Get query parameters for actor filtering
    const { searchParams } = new URL(request.url);
    const actorName = searchParams.get("actorName") || "";
    const actorGenre = searchParams.get("actorGenre") || "";

    // Test basic connection
    await query<any>(`SELECT 1 as test`);
    console.log("✓ Connection test passed");

    // ===== OPTIMIZED BASIC STATISTICS - PARALLEL EXECUTION =====
    console.log("\n📊 Fetching basic statistics...");

    const [totalMoviesResult, totalPersonsResult, totalAwardsResult, avgRatingResult] = await Promise.all([
      query<any>(`SELECT COUNT(*) as count FROM DimTitle WHERE title_type = 'movie'`),
      query<any>(`SELECT COUNT(*) as count FROM DimPerson`),
      query<any>(`SELECT COUNT(*) as count FROM FactOscarAwards`),
      query<any>(`
        SELECT AVG(avg_rating) as avgRating
        FROM FactRatings
        WHERE avg_rating IS NOT NULL
        LIMIT 100000
      `)
    ]);

    const totalMovies = totalMoviesResult[0]?.count || 0;
    const totalPersons = totalPersonsResult[0]?.count || 0;
    const totalAwards = totalAwardsResult[0]?.count || 0;
    const avgRating = parseFloat(avgRatingResult[0]?.avgRating) || 0;

    console.log("Basic stats:", { totalMovies, totalPersons, totalAwards, avgRating });

    // ===== 1. OPTIMIZED GENRE DISTRIBUTION =====
    console.log("\n📊 Fetching genre distribution...");
    
    const genreDistribution = await query<{ name: string; value: number }>(`
      SELECT 
        dg.genre_name as name,
        COUNT(DISTINCT dt.title_key) AS value
      FROM DimGenre dg
      JOIN DimTitle dt ON SUBSTRING(dt.genre, dg.genre_key, 1) = 'T'
      WHERE dt.title_type = 'movie'
        AND dt.genre IS NOT NULL
      GROUP BY dg.genre_name, dg.genre_key
      ORDER BY value DESC
      LIMIT 10
    `);
    console.log("Genre distribution result:", genreDistribution.length);

    // ===== 2. OPTIMIZED RATINGS TREND BY YEAR =====
    console.log("\n📈 Fetching ratings trend...");
    
    const ratingsTrend = await query<{ year: number; avgRating: number; count: number }>(`
      SELECT 
        dt.release_year AS year,
        AVG(fr.avg_rating) AS avgRating,
        COUNT(DISTINCT fr.title_key) AS count
      FROM FactRatings fr
      JOIN DimTitle dt USING (title_key)
      WHERE dt.title_type = 'movie'
        AND dt.release_year BETWEEN 2015 AND 2024
        AND fr.avg_rating IS NOT NULL
      GROUP BY dt.release_year
      ORDER BY dt.release_year
    `);
    console.log("Ratings trend result:", ratingsTrend.length);

    // ===== 3. OPTIMIZED TOP RATED MOVIES =====
    console.log("\n🏆 Fetching top rated movies...");
    
    const topRatedMovies = await query<{ title: string; rating: number; votes: number }>(`
      SELECT 
        dt.primary_title AS title, 
        fr.avg_rating AS rating, 
        fr.num_votes AS votes
      FROM FactRatings fr
      JOIN DimTitle dt USING (title_key)
      WHERE dt.title_type = 'movie'
        AND fr.num_votes >= 1000
        AND fr.avg_rating IS NOT NULL
      ORDER BY fr.avg_rating DESC, fr.num_votes DESC
      LIMIT 5
    `);
    console.log("Top rated movies result:", topRatedMovies.length);

    // ===== 4. OPTIMIZED AWARDS BY CATEGORY =====
    console.log("\n🏅 Fetching awards by category...");
    
    const awardsByCategory = await query<{ category: string; count: number }>(`
      SELECT 
        category,
        COUNT(*) as count
      FROM FactOscarAwards
      WHERE category IS NOT NULL
        AND category != ''
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log("Awards by category result:", awardsByCategory.length);

      // ===== 5. SIMPLIFIED POPULAR ACTORS (FOR TESTING) =====
    console.log("\n⭐ Fetching popular actors...");
    
    const popularActors = await query<{ name: string; movieCount: number; avgRating: number }>(`
      SELECT 
        dp.full_name as name,
        COUNT(DISTINCT bc.title_key) as movieCount,
        AVG(fr.avg_rating) as avgRating
      FROM BridgeCrew bc
      INNER JOIN DimPerson dp ON bc.person_key = dp.person_key
      INNER JOIN FactRatings fr ON bc.title_key = fr.title_key
      WHERE bc.category IN ('actor', 'actress')
        AND fr.avg_rating IS NOT NULL
      GROUP BY dp.person_key, dp.full_name
      HAVING movieCount >= 1
      ORDER BY movieCount DESC, avgRating DESC
      LIMIT 10
    `);
    console.log("Popular actors result:", popularActors.length);
    console.log("Sample data:", popularActors.slice(0, 2));

    // ===== 6. OPTIMIZED SUCCESSFUL CREW MEMBERS =====
    console.log("\n🎬 Fetching successful crew members...");
    
    const successfulCrewMembers = await query<any>(`
      SELECT 
        dp.full_name as name,
        COUNT(DISTINCT bc.title_key) as totalMovies,
        SUM(CASE 
          WHEN fr.avg_rating >= 7.0 AND fr.num_votes > 1000 
          THEN 1 ELSE 0 
        END) as highRatedMovies,
        AVG(fr.avg_rating) as avgRating
      FROM BridgeCrew bc
      INNER JOIN DimPerson dp ON bc.person_key = dp.person_key
      INNER JOIN FactRatings fr ON bc.title_key = fr.title_key
      WHERE bc.category IN ('director', 'writer')
        AND fr.avg_rating IS NOT NULL
      GROUP BY dp.person_key, dp.full_name
      HAVING totalMovies >= 2
      ORDER BY avgRating DESC
      LIMIT 10
    `).then(results => 
      results.map(crew => {
        const total = parseInt(crew.totalMovies);
        const highRated = parseInt(crew.highRatedMovies);
        const successRate = total > 0 ? (highRated / total) * 100 : 0;
        
        return {
          name: crew.name,
          totalMovies: total,
          successRate: parseFloat(successRate.toFixed(1)),
          avgRating: parseFloat(parseFloat(crew.avgRating).toFixed(2))
        };
      })
    );
    console.log("Successful crew members result:", successfulCrewMembers.length);

    // ===== 7. SIMPLIFIED BEST FILM GENRE (FOR TESTING) =====
    console.log("\n🎭 Fetching best film genre...");
    
    const bestFilmGenre = await query<any>(`
      SELECT 
        dg.genre_name as genre,
        AVG(fr.avg_rating) as avgRating,
        COUNT(DISTINCT dt.title_key) as count,
        SUM(CASE WHEN fr.avg_rating >= 7.0 THEN 1 ELSE 0 END) as highRated
      FROM DimGenre dg
      JOIN DimTitle dt ON SUBSTRING(dt.genre, dg.genre_key, 1) = 'T'
      INNER JOIN FactRatings fr ON dt.title_key = fr.title_key
      WHERE dt.title_type = 'movie'
        AND dt.genre IS NOT NULL
        AND fr.avg_rating IS NOT NULL
      GROUP BY dg.genre_name, dg.genre_key
      HAVING count >= 5
      ORDER BY avgRating DESC
      LIMIT 10
    `).then(results =>
      results.map(g => ({
        genre: g.genre,
        avgRating: parseFloat(parseFloat(g.avgRating).toFixed(2)),
        count: parseInt(g.count),
        successRate: parseFloat(((parseInt(g.highRated) / parseInt(g.count)) * 100).toFixed(1))
      }))
    );
    console.log("Best film genre result:", bestFilmGenre.length);
    console.log("Sample data:", bestFilmGenre.slice(0, 2)); 
    
    // ===== 8. OPTIMIZED RATIO OF ACTOR PROFESSIONS =====
    console.log("\n👥 Fetching ratio of actor professions...");
    
    const [ratioData, totalCrew] = await Promise.all([
      query<any>(`
        SELECT 
          category as profession,
          COUNT(*) as count
        FROM BridgeCrew
        WHERE category IS NOT NULL
          AND category != ''
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `),
      query<any>(`
        SELECT COUNT(*) as total
        FROM BridgeCrew
        WHERE category IS NOT NULL AND category != ''
      `)
    ]);

    const total = totalCrew[0]?.total || 1;
    const ratioActorProfession = ratioData.map(p => ({
      profession: p.profession,
      count: parseInt(p.count),
      percentage: parseFloat(((parseInt(p.count) / total) * 100).toFixed(2))
    }));
    console.log("Ratio of actor professions result:", ratioActorProfession.length);

    // ===== 9. OPTIMIZED POPULARITY OF ACTORS PER GENRE =====
    console.log("\n🌟 Fetching popularity of actors per genre...");
    
    const popularityActorGenre = await query<{ genre: string; actorCount: number; avgRating: number }>(`
      SELECT 
        dg.genre_name as genre,
        COUNT(DISTINCT bc.person_key) as actorCount,
        AVG(fr.avg_rating) as avgRating
      FROM DimGenre dg
      JOIN DimTitle dt ON SUBSTRING(dt.genre, dg.genre_key, 1) = 'T'
      INNER JOIN BridgeCrew bc ON bc.title_key = dt.title_key
      INNER JOIN FactRatings fr ON dt.title_key = fr.title_key
      WHERE bc.category IN ('actor', 'actress')
        AND dt.title_type = 'movie'
        AND dt.genre IS NOT NULL
        AND fr.avg_rating IS NOT NULL
      GROUP BY dg.genre_name, dg.genre_key
      HAVING actorCount >= 5
      ORDER BY actorCount DESC
      LIMIT 10
    `);
    console.log("Popularity of actors per genre result:", popularityActorGenre.length);

    // ===== OPTIMIZED STATISTICAL TESTS =====

    // 1. CORRELATION: Ratings vs Votes (Pearson)
    console.log("\n📊 Calculating Pearson correlation...");
    const correlationData = await query<{ rating: number; votes: number; title: string }>(`
      SELECT 
        dt.primary_title as title,
        fr.avg_rating as rating,
        fr.num_votes as votes
      FROM FactRatings fr
      JOIN DimTitle dt USING (title_key)
      WHERE dt.title_type = 'movie'
        AND fr.num_votes >= 100
        AND fr.avg_rating IS NOT NULL
      ORDER BY fr.num_votes DESC
      LIMIT 500
    `);

    const correlationRatingsVotes = correlationData.slice(0, 20);

    let pearsonR = 0;
    if (correlationData.length > 1) {
      const n = correlationData.length;
      const sumX = correlationData.reduce((sum, d) => sum + d.rating, 0);
      const sumY = correlationData.reduce((sum, d) => sum + d.votes, 0);
      const sumXY = correlationData.reduce((sum, d) => sum + d.rating * d.votes, 0);
      const sumX2 = correlationData.reduce((sum, d) => sum + d.rating * d.rating, 0);
      const sumY2 = correlationData.reduce((sum, d) => sum + d.votes * d.votes, 0);
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      
      pearsonR = denominator !== 0 ? numerator / denominator : 0;
    }
    console.log("Pearson correlation:", pearsonR.toFixed(4));

    // 2. OPTIMIZED CHI-SQUARE TEST
    console.log("\n🧪 Running chi-square test...");
    const chiSquareTest = await query<any>(`
      SELECT 
        dg.genre_name as genre,
        SUM(CASE WHEN foa.is_winner = 1 THEN 1 ELSE 0 END) as awardWinners,
        SUM(CASE WHEN foa.is_winner = 0 THEN 1 ELSE 0 END) as nonWinners,
        COUNT(*) as total
      FROM DimGenre dg
      JOIN DimTitle dt ON SUBSTRING(dt.genre, dg.genre_key, 1) = 'T'
      INNER JOIN FactOscarAwards foa ON foa.title_key = dt.title_key
      WHERE dt.genre IS NOT NULL
      GROUP BY dg.genre_name, dg.genre_key
      HAVING total >= 5
      ORDER BY total DESC
      LIMIT 10
    `).then(results => {
      if (results.length === 0) return [];
      
      const totalWinners = results.reduce((sum, r) => sum + parseInt(r.awardWinners), 0);
      const totalNominees = results.reduce((sum, r) => sum + parseInt(r.total), 0);
      const expectedWinRate = totalNominees > 0 ? totalWinners / totalNominees : 0;

      return results.map(r => {
        const total = parseInt(r.total);
        const winners = parseInt(r.awardWinners);
        const nonWinners = parseInt(r.nonWinners);
        const expectedWinners = total * expectedWinRate;
        const expectedNonWinners = total * (1 - expectedWinRate);
        
        const chiSquare = expectedWinners > 0 && expectedNonWinners > 0
          ? Math.pow(winners - expectedWinners, 2) / expectedWinners +
            Math.pow(nonWinners - expectedNonWinners, 2) / expectedNonWinners
          : 0;

        return {
          genre: r.genre,
          awardWinners: winners,
          nonWinners: nonWinners,
          chiSquare: parseFloat(chiSquare.toFixed(4)),
          pValue: chiSquare > 3.841 ? 0.05 : 0.10,
          significant: chiSquare > 3.841
        };
      });
    });
    console.log("Chi-square test results:", chiSquareTest.length);

    // 3. OPTIMIZED HYPOTHESIS TESTING - WITH DEBUG
    console.log("\n🧪 Running hypothesis testing...");
    
    // First, test the basic query without aggregation
    const testGenreJoin = await query<any>(`
      SELECT COUNT(*) as total
      FROM DimGenre dg
      JOIN DimTitle dt ON SUBSTRING(dt.genre, dg.genre_key, 1) = 'T'
      INNER JOIN FactRatings fr ON dt.title_key = fr.title_key
      WHERE dt.title_type = 'movie'
        AND dt.genre IS NOT NULL
        AND fr.avg_rating IS NOT NULL
    `);
    console.log("Test genre join total records:", testGenreJoin[0]?.total);

    // Now try the actual query
    const hypothesisTesting = await query<any>(`
      SELECT 
        dg.genre_name as genre,
        AVG(fr.avg_rating) as avgRating,
        COUNT(DISTINCT dt.title_key) as sampleSize,
        STDDEV(fr.avg_rating) as stdDev
      FROM DimGenre dg
      JOIN DimTitle dt ON SUBSTRING(dt.genre, dg.genre_key, 1) = 'T'
      INNER JOIN FactRatings fr ON dt.title_key = fr.title_key
      WHERE dt.title_type = 'movie'
        AND dt.genre IS NOT NULL
        AND fr.avg_rating IS NOT NULL
      GROUP BY dg.genre_name, dg.genre_key
      ORDER BY avgRating DESC
      LIMIT 10
    `).then(results => {
      console.log("Raw hypothesis testing results:", results.length);
      console.log("Sample raw data:", results.slice(0, 2));
      
      if (results.length === 0) return [];
      
      // Filter after getting results
      const filtered = results.filter(r => parseInt(r.sampleSize) >= 10);
      console.log("After filtering (sampleSize >= 10):", filtered.length);
      
      return filtered.map(r => {
        const genreAvg = parseFloat(r.avgRating);
        const n = parseInt(r.sampleSize);
        const stdDev = parseFloat(r.stdDev) || 1;
        const standardError = stdDev / Math.sqrt(n);
        const tStat = standardError > 0 ? (genreAvg - avgRating) / standardError : 0;
        const pValue = Math.abs(tStat) > 2.576 ? 0.01 : (Math.abs(tStat) > 1.96 ? 0.05 : 0.10);

        return {
          genre: r.genre,
          avgRating: parseFloat(genreAvg.toFixed(2)),
          sampleSize: n,
          tStat: parseFloat(tStat.toFixed(4)),
          pValue,
          stdDev: parseFloat(stdDev.toFixed(4)),
          significant: Math.abs(tStat) > 1.96
        };
      });
    });
    console.log("Hypothesis testing results:", hypothesisTesting.length);
    if (hypothesisTesting.length > 0) {
      console.log("Sample result:", hypothesisTesting[0]);
    }

    // ===== OPTIMIZED ACTOR ANALYTICS =====

    console.log("\n⭐ Fetching actor success by year...");
    const actorSuccessByYear = await query<any>(`
      WITH TopActors AS (
        SELECT dp.person_key, dp.full_name
        FROM BridgeCrew bc
        INNER JOIN DimPerson dp ON bc.person_key = dp.person_key
        WHERE bc.category IN ('actor', 'actress')
        GROUP BY dp.person_key, dp.full_name
        ORDER BY COUNT(DISTINCT bc.title_key) DESC
        LIMIT 5
      )
      SELECT 
        ta.full_name as actor,
        dt.release_year as year,
        AVG(fr.avg_rating) as avgRating,
        COUNT(DISTINCT bc.title_key) as movieCount
      FROM TopActors ta
      INNER JOIN BridgeCrew bc ON ta.person_key = bc.person_key
      INNER JOIN DimTitle dt ON bc.title_key = dt.title_key
      INNER JOIN FactRatings fr ON dt.title_key = fr.title_key
      WHERE bc.category IN ('actor', 'actress')
        AND dt.title_type = 'movie'
        AND dt.release_year BETWEEN 2015 AND 2024
        AND fr.avg_rating IS NOT NULL
      GROUP BY ta.person_key, ta.full_name, dt.release_year
      ORDER BY ta.full_name, dt.release_year
    `);
    console.log("Actor success by year:", actorSuccessByYear.length);

    const crewProfessionRatio = ratioActorProfession.slice(0, 5);

    console.log("\n🎭 Fetching actor genre popularity...");
    const actorGenrePopularity = await query<any>(`
      WITH TopActors AS (
        SELECT dp.person_key, dp.full_name
        FROM BridgeCrew bc
        INNER JOIN DimPerson dp ON bc.person_key = dp.person_key
        WHERE bc.category IN ('actor', 'actress')
        GROUP BY dp.person_key, dp.full_name
        ORDER BY COUNT(DISTINCT bc.title_key) DESC
        LIMIT 5
      )
      SELECT 
        ta.full_name as actor,
        dg.genre_name as genre,
        COUNT(DISTINCT dt.title_key) as movieCount,
        AVG(fr.avg_rating) as avgRating
      FROM TopActors ta
      INNER JOIN BridgeCrew bc ON ta.person_key = bc.person_key
      INNER JOIN DimTitle dt ON bc.title_key = dt.title_key
      JOIN DimGenre dg ON SUBSTRING(dt.genre, dg.genre_key, 1) = 'T'
      INNER JOIN FactRatings fr ON dt.title_key = fr.title_key
      WHERE bc.category IN ('actor', 'actress')
        AND dt.title_type = 'movie'
        AND dt.genre IS NOT NULL
        AND fr.avg_rating IS NOT NULL
      GROUP BY ta.person_key, ta.full_name, dg.genre_name, dg.genre_key
      ORDER BY ta.full_name, movieCount DESC
      LIMIT 25
    `).then(results =>
      results.map(row => ({
        actor: row.actor,
        genre: row.genre,
        movieCount: parseInt(row.movieCount),
        avgRating: parseFloat(parseFloat(row.avgRating).toFixed(2))
      }))
    );
    console.log("Actor genre popularity:", actorGenrePopularity.length);

    // ===== USER INPUT: ACTOR-SPECIFIC ANALYTICS =====
    let actorProfile = null;
    let actorGenreProfile = null;

    if (actorName) {
      console.log(`\n🔍 Fetching profile for actor: ${actorName}`);
      
      const actorMoviesRaw = await query<any>(`
        SELECT 
          dp.full_name as actorName,
          dt.primary_title as title,
          dt.release_year as year,
          dg.genre_name as genre,
          fr.avg_rating as rating,
          fr.num_votes as votes
        FROM DimPerson dp
        INNER JOIN BridgeCrew bc ON dp.person_key = bc.person_key
        INNER JOIN DimTitle dt ON bc.title_key = dt.title_key
        JOIN DimGenre dg ON SUBSTRING(dt.genre, dg.genre_key, 1) = 'T'
        INNER JOIN FactRatings fr ON dt.title_key = fr.title_key
        WHERE bc.category IN ('actor', 'actress')
          AND dt.title_type = 'movie'
          AND dt.genre IS NOT NULL
          AND dp.full_name LIKE ?
          AND fr.avg_rating IS NOT NULL
        ORDER BY dt.release_year DESC
        LIMIT 100
      `, [`%${actorName}%`]);

      if (actorMoviesRaw.length > 0) {
        const totalRating = actorMoviesRaw.reduce((sum, m) => sum + m.rating, 0);
        const avgRatingActor = totalRating / actorMoviesRaw.length;
        const totalVotes = actorMoviesRaw.reduce((sum, m) => sum + (m.votes || 0), 0);
        
        const genreCount: Map<string, { count: number; totalRating: number }> = new Map();
        actorMoviesRaw.forEach(movie => {
          const genre = movie.genre || 'Unknown';
          const current = genreCount.get(genre) || { count: 0, totalRating: 0 };
          current.count++;
          current.totalRating += movie.rating;
          genreCount.set(genre, current);
        });

        const topGenres = Array.from(genreCount.entries())
          .map(([genre, data]) => ({
            genre,
            count: data.count,
            avgRating: parseFloat((data.totalRating / data.count).toFixed(2))
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        actorProfile = {
          actor: actorMoviesRaw[0].actorName,
          totalMovies: actorMoviesRaw.length,
          avgRating: parseFloat(avgRatingActor.toFixed(2)),
          totalVotes: totalVotes,
          topGenres,
          recentMovies: actorMoviesRaw.slice(0, 10).map(m => ({
            title: m.title,
            year: m.year,
            genre: m.genre,
            rating: parseFloat(m.rating.toFixed(2)),
            votes: m.votes
          }))
        };

        if (actorGenre) {
          const genreMovies = actorMoviesRaw.filter(m => 
            m.genre && m.genre.toUpperCase().includes(actorGenre.toUpperCase())
          );

          if (genreMovies.length > 0) {
            const genreAvgRating = genreMovies.reduce((sum, m) => sum + m.rating, 0) / genreMovies.length;
            const genreTotalVotes = genreMovies.reduce((sum, m) => sum + (m.votes || 0), 0);

            actorGenreProfile = {
              actor: actorMoviesRaw[0].actorName,
              genre: actorGenre.toUpperCase(),
              totalMovies: genreMovies.length,
              avgRating: parseFloat(genreAvgRating.toFixed(2)),
              totalVotes: genreTotalVotes,
              movies: genreMovies.slice(0, 10).map(m => ({
                title: m.title,
                year: m.year,
                rating: parseFloat(m.rating.toFixed(2)),
                votes: m.votes
              }))
            };
          } else {
            actorGenreProfile = {
              actor: actorMoviesRaw[0].actorName,
              genre: actorGenre.toUpperCase(),
              totalMovies: 0,
              avgRating: 0,
              totalVotes: 0,
              movies: []
            };
          }
        }
      }
    }

    const executionTime = Date.now() - startTime;

    const result = {
      totalMovies,
      totalPersons,
      totalAwards,
      avgRating: parseFloat(avgRating.toFixed(2)),
      genreDistribution,
      ratingsTrend,
      topRatedMovies,
      awardsByCategory,
      popularActors,
      successfulCrewMembers,
      bestFilmGenre,
      ratioActorProfession,
      popularityActorGenre,
      correlationRatingsVotes,
      chiSquareTest,
      hypothesisTesting,
      actorSuccessByYear,
      crewProfessionRatio,
      actorGenrePopularity,
      pearsonCorrelation: parseFloat(pearsonR.toFixed(4)),
      actorProfile,
      actorGenreProfile,
      executionTimeMs: executionTime
    };

    console.log("\n✅ API Response complete:", {
      executionTime: `${executionTime}ms`,
      totalMovies,
      totalPersons,
      totalAwards
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Error in API route:", error);
    return NextResponse.json({ 
      error: "Failed to fetch data from MySQL",
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}
