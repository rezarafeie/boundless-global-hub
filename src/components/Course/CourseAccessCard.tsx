
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ExternalLink, Download, MessageCircle, Bot, FileText, Gift } from "lucide-react";

interface CourseAccessCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttons: Array<{
    label: string;
    url: string;
    variant?: "default" | "outline" | "secondary";
    icon?: React.ReactNode;
  }>;
  badge?: string;
  className?: string;
}

const CourseAccessCard = ({ 
  title, 
  description, 
  icon, 
  buttons, 
  badge, 
  className = "" 
}: CourseAccessCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`h-full border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 w-fit">
            {icon}
          </div>
          <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
            {title}
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {buttons.map((button, index) => (
            <Button
              key={index}
              variant={button.variant || "default"}
              size="sm"
              className="w-full justify-start gap-2"
              asChild
            >
              <a 
                href={button.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                {button.icon}
                {button.label}
                <ExternalLink size={14} className="ml-auto" />
              </a>
            </Button>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CourseAccessCard;
