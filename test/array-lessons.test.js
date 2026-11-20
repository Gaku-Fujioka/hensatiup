import test from "node:test";
import assert from "node:assert/strict";
import {arrayLessons} from "../src/array-lessons.js";
import {runLesson} from "../src/trace.js";

for(const lesson of arrayLessons.filter(l=>l.group==="ソート")){
  test(lesson.title+" sorts edge cases without altering the caller's input",()=>{
    for(const values of [[],[3],[-2,-2,5,0],[5,4,3,2,1],[1,2,3]]){
      const expected=[...values].sort((a,b)=>a-b);
      const copy=[...values];
      const trace=runLesson(lesson,{values});
      assert.deepEqual(trace.answer,expected);assert.deepEqual(values,copy);
      assert.ok(trace.frames.slice(1,-1).every(f=>f.line>=0));
    }
  });
}
test("search, range and window edge cases",()=>{
  const run=(id,data)=>runLesson(arrayLessons.find(l=>l.id===id),data).answer;
  assert.equal(run("linear",{values:[3,1,3],target:3}),0);
  assert.equal(run("binary",{values:[],target:0}),-1);
  assert.throws(()=>run("binary",{values:[2,1],target:1}),/昇順/);
  assert.deepEqual(run("pointers",{values:[2,2],target:4}),[0,1]);
  assert.equal(run("window",{values:[-4,-3,-5],width:2}),-7);
  assert.equal(run("prefix",{values:[1,2,3],left:1,right:1}),0);
});
