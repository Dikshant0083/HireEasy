// Run: node services/scorer.test.js
const assert = require('assert');
const { extractSkills } = require('./resumeParser');
const { matchDetails } = require('./scorer');

// Boundaries: Java is not JavaScript, C is not C++ / C#, "go" the verb is not Go.
assert.deepStrictEqual(extractSkills('Strong JavaScript and C++ skills'), ['JavaScript', 'C++']);
assert.deepStrictEqual(extractSkills('Ready to go the extra mile in R&D'), []);
assert.deepStrictEqual(extractSkills('Backend in Go, Node.js and C#'), ['C#', 'Go', 'Node.js']);
assert.ok(extractSkills('Experience with react and node.js').includes('React'));

const job = { _id: 'j1', title: 'Frontend Engineer', tags: ['React'], description: 'React, TypeScript, CSS and Git required.' };
const m = matchDetails(['React', 'Java', 'CSS'], job);
assert.deepStrictEqual(m.matched, ['React', 'CSS']);
assert.deepStrictEqual(m.missing.sort(), ['Git', 'TypeScript']);
assert.strictEqual(m.score, 57); // coverage 2/4, relevance 2/3 → F1 0.571

// A role using more of your skills outranks a thin listing you happen to cover well.
const me = ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Python', 'Docker', 'Git', 'REST API'];
const thinJava = matchDetails(me, { _id: 'a', title: 'Java Intern', description: 'Java, JavaScript and Docker' });
const mern = matchDetails(me, { _id: 'b', title: 'MERN Developer', description: 'React, Node.js and Express, MongoDB, SQL, JavaScript, HTML, CSS, Redux, Tailwind' });
assert.ok(mern.score > thinJava.score, `${mern.score} should beat ${thinJava.score}`);

assert.strictEqual(matchDetails(['React'], { _id: 'j2', title: 'Merit scholarship', description: 'For students' }).score, null);

// One named skill is not enough evidence for a percentage, but the match is still reported.
const thin = matchDetails(['Python'], { _id: 'j3', title: 'Quantum Compiler Engineer', description: 'A Python layer for quantum apps' });
assert.strictEqual(thin.score, null);
assert.deepStrictEqual(thin.matched, ['Python']);

// "Express" only counts as the framework with context.
assert.deepStrictEqual(extractSkills('Please express your interest. We accept American Express.'), []);
assert.ok(extractSkills('Backend in Node.js and Express').includes('Express'));
assert.ok(extractSkills('Built REST APIs with Express.js').includes('Express'));
assert.strictEqual(matchDetails([], job).score, null);

console.log('scorer: all checks passed');
