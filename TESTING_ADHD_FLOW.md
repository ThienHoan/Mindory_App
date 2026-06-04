# ADHD Flow Manual QA Checklist

Use this checklist to verify the parent-assigned ADHD-friendly study flow end to end.

## Parent Assign

- [ ] Parent opens the assign page.
- [ ] Default session settings are `10 phút` per session and `1` session per day.
- [ ] Parent selects a child.
- [ ] Parent selects a lesson.
- [ ] Parent keeps the assigned date as today.
- [ ] Summary shows `Tổng thời gian ước tính` as `10 phút`.
- [ ] Summary shows expected XP under `XP dự kiến`.
- [ ] Parent submits the assignment successfully.

## Child Task Visibility

- [ ] Child sees the assigned task for today.
- [ ] Child can open the assigned PDF study room.
- [ ] Study/PDF flow can show a short controlled game break.
- [ ] Reloading during study does not lose meaningful progress.

## Study To Quiz Gate

- [ ] Before 5 minutes of active study time, child cannot enter the assigned task quiz.
- [ ] After 5 minutes of active study time, child can enter the assigned task quiz.
- [ ] Reloading during quiz does not significantly break or reset the timer.

## Assigned Quiz Completion

- [ ] Assigned quiz can show a 45-second controlled game break when the break policy is enabled.
- [ ] Game break has a hard timer.
- [ ] When the game break timer ends, the flow automatically moves to reset/break state and then returns to the question.
- [ ] Game break does not grant the main reward or XP.
- [ ] Finishing the assigned quiz creates the expected reward or XP.
- [ ] Main reward appears only after completing the quiz or session.
- [ ] Completed task state is reflected after finishing the quiz.

## Date Filtering

- [ ] A task assigned for a future date should not appear as today's task once backend date filtering is supported.

## Free Quiz Regression

- [ ] Free quiz still opens normally.
- [ ] Free quiz can show a controlled game break.
- [ ] Free quiz still allows completion.
- [ ] Free quiz reward behavior still works as expected.
