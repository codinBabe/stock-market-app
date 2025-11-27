import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import {
  getMyWatchlist,
  toggleWatchlistAction,
} from "@/lib/actions/watchlist.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getNews,
  getQuotesForSymbols,
  searchStocks,
} from "@/lib/actions/finnhub.actions";
import WatchlistButton from "@/components/watchlist-button";
import SearchCommand from "@/components/search-command";
import AlertDialog from "@/components/alert-dialog";
import { getMyAlerts } from "@/lib/actions/alert.actions";
import AlertsList from "@/components/alerts-list";
import NewsCard from "@/components/news-card";

export default async function WatchlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="watchlist-empty-container">
        <p className="watchlist-empty">
          Please sign in to view your watchlist.
        </p>
      </div>
    );
  }

  const stocks = await searchStocks();
  const watchlistItems = await getMyWatchlist();
  const myAlerts = await getMyAlerts();

  const stockSymbols = stocks.map((s) => s.symbol);
  const watchSymbols = watchlistItems.map((i) => i.symbol);
  const alertSymbols = myAlerts.map((a) => a.symbol);
  const allSymbols = Array.from(
    new Set([...stockSymbols, ...watchSymbols, ...alertSymbols])
  );
  const news = await getNews(stockSymbols);

  const allQuotes =
    allSymbols.length > 0 ? await getQuotesForSymbols(allSymbols) : [];
  const quoteBySymbol: Record<string, any> = allQuotes.reduce((acc, q) => {
    if (q?.symbol) acc[q.symbol] = q;
    return acc;
  }, {} as Record<string, any>);

  const stocksWithPrices = stocks.map((s) => ({
    ...s,
    price: quoteBySymbol[s.symbol]?.currentPrice ?? null,
  }));

  const watchlist = watchlistItems.map((item) => ({
    ...item,
    ...(quoteBySymbol[item.symbol] || {}),
  }));

  const alertsEnriched: Alert[] = myAlerts.map((a) => {
    const live = quoteBySymbol[a.symbol];
    return {
      ...a,
      logo: live?.logo ?? null,
      currentPrice: live?.currentPrice ?? NaN,
      changePercent: live?.changePercent ?? undefined,
    };
  });

  return (
    <section>
      {/* ---------------- WATCHLIST TABLE ---------------- */}
      <div className="watchlist-container">
        <div className="watchlist">
          <div className="flex items-center justify-between mb-4">
            <h1 className="watchlist-title">Watchlist</h1>
            <SearchCommand renderAs="button" initialStocks={stocks} />
          </div>

          {watchlist.length === 0 ? (
            <div className="watchlist-empty-container">
              <p className="watchlist-empty">
                Your watchlist is empty. Start adding stocks from the stock
                details page.
              </p>
            </div>
          ) : (
            <Table className="watchlist-table">
              <TableHeader>
                <TableRow className="table-header-row">
                  <TableHead className="table-header">Company</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Market Cap</TableHead>
                  <TableHead>P/E Ratio</TableHead>
                  <TableHead>Alert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchlist.map((item) => (
                  <TableRow key={item.symbol} className="table-row">
                    <TableCell className="table-cell">
                      <WatchlistButton
                        type="icon"
                        symbol={item.symbol}
                        isInWatchlist={true}
                        company={item.company}
                        onWatchlistChange={async (symbol, next) => {
                          "use server";
                          await toggleWatchlistAction(
                            symbol,
                            item.company,
                            next
                          );
                        }}
                      />
                      {item.company}
                    </TableCell>
                    <TableCell className="table-cell">{item.symbol}</TableCell>
                    <TableCell className="table-cell">
                      {item.currentPrice}
                    </TableCell>
                    <TableCell
                      className={`table-cell ${
                        (item.changePercent ?? 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      } `}
                    >
                      {(item.changePercent ?? 0) >= 0 ? "+" : ""}
                      {item.changePercent !== null &&
                      item.changePercent !== undefined
                        ? item.changePercent.toFixed(2)
                        : "--"}
                      %
                    </TableCell>
                    <TableCell className="table-cell">
                      {item.marketCap
                        ? `${(item.marketCap / 1000).toFixed(2)}T`
                        : "--"}
                    </TableCell>
                    <TableCell className="table-cell">
                      {item.peRatio ? item.peRatio.toFixed(2) : "--"}
                    </TableCell>
                    <TableCell className="table-cell">
                      <AlertDialog
                        renderAs="icon"
                        alertData={{
                          symbol: item.symbol,
                          company: item.company,
                          alertName: "",
                          alertType: "upper",
                          frequency: "1m",
                          threshold: "",
                        }}
                        price={item.currentPrice as number | undefined}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* ---------------- ALERTS PANEL ---------------- */}
        <aside className="watchlist-alerts">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Alerts</h2>
            <AlertDialog renderAs="button" availableStocks={stocksWithPrices} />
          </div>

          {alertsEnriched.length === 0 ? (
            <div className="alert-list">
              <div className="alert-empty">No alerts yet</div>
            </div>
          ) : (
            <>
              {alertsEnriched.map((alert) => (
                <AlertsList key={alert.id} {...alert} />
              ))}
            </>
          )}
        </aside>
      </div>

      {/* Display new content here */}
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4">News</h2>
        {news.length === 0 ? (
          <p className="text-gray-400">No news available at the moment.</p>
        ) : (
          <div className="watchlist-news">
            {news.map((newsItem) => (
              <NewsCard key={newsItem.id} {...newsItem} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
