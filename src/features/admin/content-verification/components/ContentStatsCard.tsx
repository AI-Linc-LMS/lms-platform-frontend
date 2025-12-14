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
        transition: "all 0.2s",
        "&:hover": onClick
          ? {
              transform: "translateY(-4px)",
              boxShadow: 3,
            }
          : {},
        border: "1px solid",
        borderColor: "var(--neutral-200)",
      }}
      onClick={onClick}
    >
      <CardContent>
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
              fontWeight: "bold",
              color: color,
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


