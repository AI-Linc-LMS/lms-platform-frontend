import { Card, CardContent, Typography, Box } from "@mui/material";
import { ContentType } from "../types";

interface ContentStatsCardProps {
  title: string;
  count: number;
  type: ContentType;
  color: string;
  onClick?: () => void;
}

const ContentStatsCard: React.FC<ContentStatsCardProps> = ({
  title,
  count,
  color,
  onClick,
}) => {
  return (
    <Card
      sx={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "var(--neutral-200)",
        boxShadow: "var(--shadow-card)",
        "&:hover": onClick
          ? {
              transform: "translateY(-2px)",
              boxShadow: "var(--shadow-card-hover)",
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "var(--font-secondary)",
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: "2rem",
              fontWeight: 700,
              color: color,
              lineHeight: 1.2,
            }}
          >
            {count}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContentStatsCard;


