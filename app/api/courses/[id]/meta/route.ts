import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

/** Course meta for Open Graph / SEO. Fetches from backend without auth so LinkedIn crawler can get preview. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const courseId = parseInt(id, 10);
  if (Number.isNaN(courseId)) {
    return NextResponse.json(
      { title: "Course", description: "Explore this course." },
      { status: 200 }
    );
  }

  const url = `${config.apiBaseUrl}/lms/clients/${config.clientId}/courses/${courseId}/`;
  try {
    const res = await fetch(url, { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json(
        { title: "Course", description: "Explore this course on our platform." },
        { status: 200 }
      );
    }
    const data = await res.json();
    const title = data.course_title ?? data.title ?? "Course";
    const description =
      data.course_description ?? data.description ?? "Explore this course on our platform.";
    const thumbnail = data.thumbnail ?? data.course_thumbnail ?? null;
    return NextResponse.json({ title, description, thumbnail });
  } catch {
    return NextResponse.json(
      { title: "Course", description: "Explore this course on our platform." },
      { status: 200 }
    );
  }
}
