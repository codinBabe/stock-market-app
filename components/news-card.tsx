import Link from "next/link";

const NewsCard = ({
  id,
  related,
  headline,
  summary,
  source,
  datetime,
}: RawNewsArticle) => {
  return (
    <div className="news-item">
      <p className="news-tag">{related}</p>
      <h3 className="news-title">{headline}</h3>
      <div className="news-meta">
        <p>Source: {source}</p>
        <p>
          Date:{" "}
          {typeof datetime === "number"
            ? new Date(datetime * 1000).toLocaleDateString()
            : "Unknown"}
        </p>
      </div>

      <p className="news-summary">{summary}</p>
      <Link className="news-cta" href={`/news/${id}`}>
        Read more &gt;
      </Link>
    </div>
  );
};

export default NewsCard;
