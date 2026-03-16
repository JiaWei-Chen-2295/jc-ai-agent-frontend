  ---                                                                                                                                                  
新增接口

GET /api/v1/quiz/session/{id}/coverage

功能: 获取当前会话的知识覆盖率

响应示例:
{
"code": 0,
"data": {
"sessionId": "a1b2c3d4-...",
"totalConcepts": 20,
"testedConcepts": 8,
"masteredConcepts": 5,
"coveragePercent": 40.0,
"masteryPercent": 25.0,
"answeredQuestions": 12,
"conceptSource": "REDIS",
"concepts": [
{
"name": "Java接口",
"status": "MASTERED",
"understandingDepth": 85,
"cognitiveLoad": 25,
"stability": 90,
"questionCount": 4
},
{
"name": "多态",
"status": "TESTING",
"understandingDepth": 55,
"cognitiveLoad": 60,
"stability": 45,
"questionCount": 2
},
{
"name": "泛型",
"status": "UNTESTED",
"understandingDepth": null,
"cognitiveLoad": null,
"stability": null,
"questionCount": 0
}
]
},
"message": ""
}

