import React from "react";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Calendar, CheckCircle, Play } from "lucide-react";

const AppLearning = () => {
  const weeklyProgress = 65;
  const dailyGoal = { current: 3, target: 5 };
  
  const tasks = [
    { id: 1, title: "تکمیل درس ۶ دوره درآمد پسیو", priority: "high", dueDate: "امروز", completed: false },
    { id: 2, title: "مطالعه فصل ۳ کتاب تجارت", priority: "medium", dueDate: "فردا", completed: false },
    { id: 3, title: "انجام تمرین عملی", priority: "low", dueDate: "۲ روز", completed: true }
  ];

  return (
    <AppLayout title="مسیر یادگیری">
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={20} />
              هدف هفتگی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{dailyGoal.current}/{dailyGoal.target}</div>
                <div className="text-sm text-muted-foreground">درس امروز</div>
              </div>
              <Progress value={weeklyProgress} />
              <div className="text-center text-sm text-muted-foreground">
                {weeklyProgress}% از هدف هفتگی تکمیل شده
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-4">وظایف امروز</h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className={task.completed ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {task.completed ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border border-primary rounded-full" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{task.dueDate}</Badge>
                          <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"} className="text-xs">
                            {task.priority === "high" ? "فوری" : task.priority === "medium" ? "متوسط" : "کم"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {!task.completed && (
                      <Button size="sm">
                        <Play size={14} className="ml-1" />
                        شروع
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppLearning;