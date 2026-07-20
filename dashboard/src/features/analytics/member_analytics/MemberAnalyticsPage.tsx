import { useState, useEffect } from 'react';
import './MemberAnalyticsPage.css';

interface Member {
  member_number: string;
  email: string;
  last_name_kanji: string;
  first_name_kanji: string;
  last_name_kana: string;
  first_name_kana: string;
  last_name_romaji: string;
  first_name_romaji: string;
  birthdate: string;
  gender: string;
  phone_number: string;
  postal_code: string;
  address: string;
  card_type: string;
  miles: number;
  created_at: string;
}

interface MemberKPIs {
  total_members: number;
  total_miles: number;
  avg_miles: number;
}

interface GenderBreakdown {
  gender: string;
  count: number;
}

interface CardBreakdown {
  card_type: string;
  count: number;
}

interface MemberActivity {
  event_id: string;
  session_id: string;
  event_name: string;
  user_agent: string;
  device_type: string;
  browser: string;
  properties: string; // JSON string
  timestamp: string;
}

export const MemberAnalyticsPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [kpis, setKpis] = useState<MemberKPIs>({ total_members: 0, total_miles: 0, avg_miles: 0 });
  const [genderData, setGenderData] = useState<GenderBreakdown[]>([]);
  const [cardData, setCardData] = useState<CardBreakdown[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activities, setActivities] = useState<MemberActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);

  // Poll for member master and KPIs every 2 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Member Master
        const membersRes = await fetch('/api/members');
        const membersData = await membersRes.json();
        if (membersRes.ok) {
          setMembers(membersData.members || []);
          
          // Auto-select first member on first load if none selected
          if (firstLoad && membersData.members && membersData.members.length > 0) {
            setSelectedMember(membersData.members[0]);
          }
        }

        // Fetch Member KPIs
        const kpisRes = await fetch('/api/analytics/members/kpis');
        const kpisData = await kpisRes.json();
        if (kpisRes.ok) {
          setKpis(kpisData.kpis || { total_members: 0, total_miles: 0, avg_miles: 0 });
          setGenderData(kpisData.genderBreakdown || []);
          setCardData(kpisData.cardBreakdown || []);
        }

        setError('');
      } catch (err: any) {
        console.error('[MemberAnalytics] Fetch error:', err);
        setError('会員データの同期に失敗しました。サーバーの稼働状態を確認してください。');
      } finally {
        setFirstLoad(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [firstLoad]);

  // Fetch activities when selected member changes
  useEffect(() => {
    if (!selectedMember) return;

    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/analytics/members/activity/${selectedMember.member_number}`);
        const data = await res.json();
        if (res.ok) {
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('[MemberAnalytics] Activity fetch error:', err);
      }
    };

    fetchActivity();
    // Poll activity for selected member as well to keep timeline real-time
    const interval = setInterval(fetchActivity, 2000);
    return () => clearInterval(interval);
  }, [selectedMember]);

  // Filter members list by search query
  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      m.member_number.includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.last_name_kanji.toLowerCase().includes(query) ||
      m.first_name_kanji.toLowerCase().includes(query) ||
      m.last_name_kana.toLowerCase().includes(query) ||
      m.first_name_kana.toLowerCase().includes(query)
    );
  });

  const getEventBadgeClass = (name: string) => {
    switch (name) {
      case 'register_success': return 'badge-success';
      case 'login_success': return 'badge-info';
      case 'search_flights': return 'badge-warning';
      case 'search_reservation': return 'badge-secondary';
      case 'logout': return 'badge-danger';
      default: return 'badge-default';
    }
  };

  const getEventNameJP = (name: string) => {
    switch (name) {
      case 'register_success': return '新規会員入会';
      case 'login_success': return 'ログイン';
      case 'search_flights': return '空席照会 (フライト検索)';
      case 'search_reservation': return '予約照会';
      case 'logout': return 'ログアウト';
      case 'page_view': return 'ページ閲覧';
      case 'click_login_btn': return 'ログインボタン押下';
      case 'click_register_btn': return '入会ボタン押下';
      case 'switch_category': return '路線の切替 (国内/国際)';
      case 'click_quick_link': return '予約ペインクイックリンク押下';
      default: return name;
    }
  };

  const parseProps = (propsStr: string) => {
    try {
      const props = JSON.parse(propsStr);
      if (Object.keys(props).length === 0) return null;
      return props;
    } catch {
      return null;
    }
  };

  return (
    <div className="member-analytics-page">
      <div className="page-header">
        <h2 className="view-title">会員・マイル分析 (STAR LINK)</h2>
        <p className="view-subtitle">登録された会員マスターデータ管理と、ログイン会員のリアルタイム行動トラッキングを可視化します。</p>
      </div>

      {error && <div className="db-error-alert">{error}</div>}

      {/* KPI Cards Section */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">登録マイル会員数 (Master Data)</div>
          <div className="kpi-value">{kpis.total_members?.toLocaleString() || 0} <span className="unit">名</span></div>
          <div className="kpi-desc">DuckDB membersテーブル レコード数</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">総発行マイル数</div>
          <div className="kpi-value">{kpis.total_miles?.toLocaleString() || 0} <span className="unit">マイル</span></div>
          <div className="kpi-desc">新規入会特典(1000マイル)などの累計</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">平均保有マイル</div>
          <div className="kpi-value">{Math.floor(kpis.avg_miles || 0).toLocaleString()} <span className="unit">マイル</span></div>
          <div className="kpi-desc">会員1名あたりの平均マイル残高</div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="member-layout">
        {/* Left Side: Member Directory */}
        <div className="member-list-panel">
          <div className="panel-header-search">
            <h3>会員マスタ一覧</h3>
            <input
              type="text"
              placeholder="会員番号、氏名、メールで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="table-wrapper">
            {filteredMembers.length === 0 ? (
              <div className="empty-message">該当する会員がいません。</div>
            ) : (
              <table className="members-table">
                <thead>
                  <tr>
                    <th>会員番号</th>
                    <th>氏名</th>
                    <th>メールアドレス</th>
                    <th>保有マイル</th>
                    <th>カード種別</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr
                      key={m.member_number}
                      className={`member-row ${selectedMember?.member_number === m.member_number ? 'selected' : ''}`}
                      onClick={() => setSelectedMember(m)}
                    >
                      <td><strong className="mono">{m.member_number}</strong></td>
                      <td>{m.last_name_kanji} {m.first_name_kanji}</td>
                      <td className="email-cell">{m.email}</td>
                      <td><span className="mono bold">{m.miles?.toLocaleString()}</span></td>
                      <td className="card-cell">{m.card_type.split(' (')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Member Details & Real-Time Action Log */}
        <div className="member-details-panel">
          {selectedMember ? (
            <div className="detail-container">
              {/* Profile Card */}
              <div className="profile-section">
                <div className="profile-header">
                  <div className="avatar">{selectedMember.last_name_kanji[0]}</div>
                  <div>
                    <h4>{selectedMember.last_name_kanji} {selectedMember.first_name_kanji} 様</h4>
                    <p className="mono font-sm">{selectedMember.last_name_kana} {selectedMember.first_name_kana} | {selectedMember.last_name_romaji.toUpperCase()} {selectedMember.first_name_romaji.toUpperCase()}</p>
                  </div>
                </div>

                <div className="profile-details-grid">
                  <div className="detail-item"><span className="label">会員番号</span><span className="val mono">{selectedMember.member_number}</span></div>
                  <div className="detail-item"><span className="label">メール</span><span className="val">{selectedMember.email}</span></div>
                  <div className="detail-item"><span className="label">生年月日</span><span className="val">{selectedMember.birthdate}</span></div>
                  <div className="detail-item"><span className="label">性別</span><span className="val">{selectedMember.gender}</span></div>
                  <div className="detail-item"><span className="label">電話番号</span><span className="val mono">{selectedMember.phone_number}</span></div>
                  <div className="detail-item"><span className="label">郵便番号</span><span className="val mono">〒{selectedMember.postal_code}</span></div>
                  <div className="detail-item"><span className="label">ご住所</span><span className="val">{selectedMember.address}</span></div>
                  <div className="detail-item"><span className="label">保有マイル</span><span className="val bold text-gold">{selectedMember.miles?.toLocaleString()} マイル</span></div>
                  <div className="detail-item"><span className="label">カード種別</span><span className="val font-sm">{selectedMember.card_type}</span></div>
                  <div className="detail-item"><span className="label">入会日</span><span className="val font-sm">{new Date(selectedMember.created_at).toLocaleDateString()}</span></div>
                </div>
              </div>

              {/* Action Log Timeline */}
              <div className="activity-section">
                <h3>リアルタイム行動履歴 (CDPトラッキング)</h3>
                <p className="activity-subtitle">Kafka ➔ Beam Streaming ETL を経由した、この会員のアクションイベントです。</p>
                
                {activities.length === 0 ? (
                  <div className="empty-message-small">この会員の行動ログがありません（ログイン前の行動、または未操作）。</div>
                ) : (
                  <div className="timeline">
                    {activities.map((act) => {
                      const propertiesObj = parseProps(act.properties);
                      return (
                        <div className="timeline-item" key={act.event_id}>
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <div className="timeline-meta">
                              <span className={`event-badge ${getEventBadgeClass(act.event_name)}`}>
                                {getEventNameJP(act.event_name)}
                              </span>
                              <span className="time-label">
                                {new Date(act.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="timeline-desc">
                              <span className="device-browser-lbl">Device: {act.device_type} ({act.browser})</span>
                              {propertiesObj && (
                                <div className="properties-dump">
                                  {propertiesObj.from_airport && (
                                    <div className="route-indicator">
                                      {propertiesObj.from_airport} ➔ {propertiesObj.to_airport} ({propertiesObj.category === 'domestic' ? '国内線' : '国際線'})
                                      <br />
                                      出発日: {propertiesObj.departure_date} | 人数: {propertiesObj.passengers_count}名
                                    </div>
                                  )}
                                  {!propertiesObj.from_airport && (
                                    <pre className="props-raw">{JSON.stringify(propertiesObj)}</pre>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-panel-view">
              <span className="icon">👤</span>
              <p>左側の会員一覧から会員を選択すると、詳細なプロフィール情報とリアルタイム行動トラッキングログが表示されます。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
