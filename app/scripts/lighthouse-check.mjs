#!/usr/bin/env node

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const url = process.argv[2] || 'http://localhost:4173';

async function runLighthouse() {
  console.log('\n🚀 Running Lighthouse Performance Audit...\n');

  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu'],
    });

    const options = {
      logLevel: 'error',
      output: 'json',
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    };

    const runnerResult = await lighthouse(url, options);
    const lhr = runnerResult.lhr;
    const scores = lhr.categories;
    const audits = lhr.audits;

    // Display scores
    console.log('📊 LIGHTHOUSE AUDIT RESULTS\n');

    const formatScore = (score) => {
      const percentage = (score * 100).toFixed(0);
      const icon = percentage >= 90 ? '🟢' : percentage >= 50 ? '🟡' : '🔴';
      const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
      return `${icon} ${percentage.padStart(3)}% ${bar}`;
    };

    console.log('  CATEGORY                    SCORE');
    console.log('  ' + '-'.repeat(70));
    console.log(`  ⚡ Performance              ${formatScore(scores.performance.score)}`);
    console.log(`  ♿ Accessibility            ${formatScore(scores.accessibility.score)}`);
    console.log(`  ✅ Best Practices           ${formatScore(scores['best-practices'].score)}`);
    console.log(`  🔍 SEO                      ${formatScore(scores.seo.score)}`);
    console.log('');

    // Display failed audits and opportunities
    let hasIssues = false;

    // Performance opportunities
    const opportunities = Object.values(audits).filter(
      (audit) => audit.score !== null && audit.score < 1 && audit.details?.type === 'opportunity'
    );

    if (opportunities.length > 0) {
      hasIssues = true;
      console.log('\n⚡ PERFORMANCE OPPORTUNITIES\n');
      opportunities.forEach((audit, idx) => {
        const savings = audit.details?.overallSavingsMs || 0;
        console.log(`  ${idx + 1}. 🔸 ${audit.title}`);
        console.log(`     ${audit.description}`);
        if (savings > 0) {
          console.log(`     💾 Potential savings: ${Math.round(savings)}ms`);
        }
        console.log('');
      });
    }

    // Failed audits by category
    for (const [categoryKey, category] of Object.entries(scores)) {
      const categoryAudits = category.auditRefs
        .map((ref) => audits[ref.id])
        .filter(
          (audit) =>
            audit &&
            audit.score !== null &&
            audit.score < 1 &&
            audit.details?.type !== 'opportunity'
        );

      if (categoryAudits.length > 0) {
        hasIssues = true;
        const categoryName = category.title;
        const emoji =
          categoryKey === 'performance'
            ? '⚡'
            : categoryKey === 'accessibility'
              ? '♿'
              : categoryKey === 'best-practices'
                ? '✅'
                : '🔍';

        console.log(`\n${emoji} ${categoryName.toUpperCase()} ISSUES\n`);

        categoryAudits.forEach((audit, idx) => {
          console.log(`  ${idx + 1}. 🔴 ${audit.title}`);
          console.log(`     ${audit.description}`);

          if (audit.description && audit.description.includes('Learn')) {
            const linkMatch = audit.description.match(/https?:\/\/[^\s]+/);
            if (linkMatch) {
              console.log(`     📖 ${linkMatch[0]}`);
            }
          }

          // Show specific items if available
          if (audit.details?.items && audit.details.items.length > 0) {
            const items = audit.details.items.slice(0, 3); // Show first 3 items
            console.log(`     Affected items:`);
            items.forEach((item, i) => {
              if (item.node?.snippet) {
                console.log(`       ${i + 1}. ${item.node.snippet.substring(0, 60)}...`);
              } else if (item.url) {
                console.log(`       ${i + 1}. ${item.url}`);
              }
            });
            if (audit.details.items.length > 3) {
              console.log(`       ... and ${audit.details.items.length - 3} more`);
            }
          }
          console.log('');
        });
      }
    }

    // Summary
    const allScores = Object.values(scores).map((s) => s.score);
    const minScore = Math.min(...allScores);

    console.log('-'.repeat(80));
    if (minScore < 0.9) {
      console.log('\n⚠️  RESULT: Some scores are below 90. Review the issues above.');
      console.log('💡 Tip: Address the highest-impact issues first for best results.\n');
      process.exit(1);
    } else if (hasIssues) {
      console.log('\n✅ RESULT: All scores are excellent, but there are minor improvements to consider.\n');
      process.exit(0);
    } else {
      console.log('\n✅ RESULT: All scores are excellent! No issues found.\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Lighthouse failed:', error.message);
    console.log('');
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

runLighthouse();
