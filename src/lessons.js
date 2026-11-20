export const lessons = {
  bfs: { title:'幅優先探索', en:'Breadth-first search', heading:'近いマスから順番に', detail:'出発地から1歩、2歩、3歩と、波が広がるように調べます。最初に目的地に着いた経路が、歩数のいちばん少ない経路です。', rule:'通ったマスの数を優先。砂地も平地も1歩です。', icon:'<path d="M3 6h16M3 11h12M3 16h7"/><circle cx="18" cy="16" r="2"/>' },
  dijkstra: { title:'ダイクストラ法', en:'Dijkstra', heading:'安く着けるマスから', detail:'出発地からの累積コストがいちばん小さい候補を選びます。遠回りでも砂地を避けた方が安ければ、その経路が残ります。', rule:'平地は1、砂地は4。累積コストが小さい順です。', icon:'<path d="m4 16 6-10 9 8M4 16l15-2"/><circle cx="4" cy="16" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="19" cy="14" r="2"/>' },
  astar: { title:'A* 探索', en:'A-star search', heading:'残りの距離を見積もる', detail:'累積コストに、目的地までの縦横の距離を足して候補を選びます。この地図では残りのコストを高く見積もらないので、最小コストの経路を見つけられます。', rule:'累積コスト + 残りの縦横の距離が小さい順です。', icon:'<path d="m4 17 13-13-3 9-4-2-6 6Z"/>' }
};
