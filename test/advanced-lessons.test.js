import test from "node:test";
import assert from "node:assert/strict";
import {advancedLessons} from "../src/advanced-lessons.js";
import {runLesson} from "../src/trace.js";
const examples={factorial:120,gcd:6,sieve:[2,3,5,7,11,13,17,19,23,29],power:243,subsets:[[],[7],[4],[4,7],[2],[2,7],[2,4],[2,4,7]],kmp:2,fibonacci:21,change:2,knapsack:11,lcs:3,edit:1,lis:3};
for(const lesson of advancedLessons)test(lesson.title+" textbook example and trace",()=>{
  const {answer,frames}=runLesson(lesson,lesson.example);
  assert.deepEqual(answer,examples[lesson.id]);assert.ok(frames.slice(1,-1).every(f=>f.line>=0));
});
test("boundary conditions and deeply overlapping patterns",()=>{
  const run=(id,input)=>runLesson(advancedLessons.find(l=>l.id===id),input).answer;
  assert.equal(run("factorial",{n:0}),1);assert.equal(run("power",{base:-9,exponent:0}),1);
  assert.equal(run("change",{coins:[2],amount:3}),null);assert.equal(run("change",{coins:[],amount:0}),0);
  assert.equal(run("knapsack",{weights:[1],profits:[3],capacity:4}),3);
  assert.equal(run("edit",{a:"",b:"春夏"}),2);assert.equal(run("lis",{values:[2,2,2]}),1);
  assert.equal(run("kmp",{text:"🍎🍏🍎🍏🍎🍐",pattern:"🍎🍏🍎🍐"}),2);
  assert.equal(run("kmp",{text:"abc",pattern:""}),0);
  assert.deepEqual(run("sieve",{limit:1}),[]);assert.deepEqual(run("subsets",{values:[]}),[[]]);
});
