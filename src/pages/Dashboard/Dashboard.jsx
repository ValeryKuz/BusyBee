import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHive } from '../../hooks/useHive';
import { BeeMascot } from '../../components/BeeMascot';
import { BeeCard } from '../../components/BeeCard';
import { HoneyJar } from '../../components/HoneyJar';
import { BehaviorButtons } from '../../components/BehaviorButtons';
import { EventCountdown } from '../../components/EventCountdown';
import { DailyFunLottie } from '../../components/DailyFunLottie';
import { Button, Modal } from '../../components/ui';
import { ANIMAL_AVATARS, DAILY_FUN_CATEGORIES } from '../../utils/constants';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut,
    children,
    addChild,
    deleteChild,
    getUpcomingEvents,
    getChildTodayHoney,
    getChildTotalHoney,
    settings,
    setDailyFunCategory,
    getDailyFunContent,
    loading,
    error,
  } = useHive();
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAvatar, setNewChildAvatar] = useState(ANIMAL_AVATARS[0].emoji);
  const [newChildBirthday, setNewChildBirthday] = useState('');

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;
  const upcomingEvents = getUpcomingEvents().slice(0, 3);
  const greeting = getGreeting();
  const dailyFun = getDailyFunContent();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  const formatBirthday = (birthday) => {
    if (!birthday) return null;
    const [, month, day] = birthday.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
  };

  const renderDailyFunContent = () => {
    const { category, content } = dailyFun;
    switch (category) {
      case 'animal':
        return (
          <>
            {content.lottie ? (
              <DailyFunLottie animationKey={content.lottie} className={styles.dailyFunLottie} />
            ) : (
              <div className={styles.dailyFunEmoji}>{content.emoji}</div>
            )}
            <div className={styles.dailyFunName}>{content.name}</div>
            <div className={styles.dailyFunSound}>"{content.sound}"</div>
          </>
        );
      case 'joke':
        return (
          <>
            <div className={styles.dailyFunEmoji}>😂</div>
            <div className={styles.dailyFunJokeSetup}>{content.setup}</div>
            <div className={styles.dailyFunJokePunchline}>{content.punchline}</div>
          </>
        );
      case 'fact':
        return (
          <>
            <div className={styles.dailyFunEmoji}>{content.emoji}</div>
            <div className={styles.dailyFunFact}>{content.fact}</div>
          </>
        );
      case 'color':
        return (
          <>
            <div className={styles.dailyFunEmoji}>{content.emoji}</div>
            <div className={styles.dailyFunColorName} style={{ color: content.hex }}>{content.color}</div>
            <div className={styles.dailyFunColorThings}>{content.things}</div>
          </>
        );
      case 'challenge':
        return (
          <>
            <div className={styles.dailyFunEmoji}>{content.emoji}</div>
            <div className={styles.dailyFunChallenge}>{content.challenge}</div>
          </>
        );
      case 'word':
        return (
          <>
            <div className={styles.dailyFunEmoji}>{content.emoji}</div>
            <div className={styles.dailyFunWord}>{content.word}</div>
            <div className={styles.dailyFunMeaning}>{content.meaning}</div>
          </>
        );
      default:
        return null;
    }
  };

  const getDailyFunTitle = () => {
    const titles = {
      animal: "Today's Silly Animal!",
      joke: "Joke of the Day!",
      fact: "Fun Fact!",
      color: "Color of the Day!",
      challenge: "Today's Challenge!",
      word: "Magic Word!",
    };
    return titles[dailyFun.category] || "Daily Fun!";
  };

  const handleAddChild = async () => {
    if (newChildName.trim()) {
      await addChild(newChildName.trim(), newChildAvatar, newChildBirthday || null);
      setNewChildName('');
      setNewChildAvatar(ANIMAL_AVATARS[0].emoji);
      setNewChildBirthday('');
      setShowAddChild(false);
    }
  };

  const handleChildClick = (child) => {
    setSelectedChildId(selectedChildId === child.id ? null : child.id);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <BeeMascot size="large" animate />
          <p>Loading your hive...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>Oops! Something went wrong.</p>
          <p className={styles.errorMessage}>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.greeting}>
          <BeeMascot size="medium" animate />
          <h1 className={styles.title}>{greeting}!</h1>
        </div>
        <nav className={styles.nav}>
          <Button variant="ghost" size="small" onClick={() => navigate('/calendar')}>
            📅
          </Button>
          <Button variant="ghost" size="small" onClick={() => navigate('/events')}>
            🎉
          </Button>
          <Button variant="ghost" size="small" onClick={() => setShowSettings(true)}>
            ⚙️
          </Button>
        </nav>
      </header>

      <div className={styles.topRow}>
        <div className={styles.topRowLeft}>
          {children.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🐝</span>
              <p className={styles.emptyText}>No little bees yet!</p>
              <Button variant="primary" size="large" onClick={() => setShowAddChild(true)}>
                Add your first bee
              </Button>
            </div>
          ) : (
            <section className={`${styles.section} ${styles.childrenSection}`}>
              <h2 className={styles.sectionTitle}>Little Bees</h2>
              <div className={styles.childrenGrid}>
                {children.map((child) => (
                  <BeeCard
                    key={child.id}
                    child={child}
                    onClick={handleChildClick}
                    isSelected={selectedChildId === child.id}
                    todayHoney={getChildTodayHoney(child.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
        <div className={styles.topRowRight}>
          <div className={styles.dailyFunCard}>
            <h3 className={styles.dailyFunTitle}>{getDailyFunTitle()}</h3>
            <div className={styles.dailyFunContent}>
              {renderDailyFunContent()}
            </div>
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <button className={styles.kidsScreenFab} onClick={() => navigate('/kids')}>
          <span className={styles.kidsScreenFabIcon}>🎮</span>
        </button>
      )}

      <main className={styles.main}>
        {upcomingEvents.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Coming Up!</h2>
              <Button variant="ghost" size="small" onClick={() => navigate('/events')}>
                See all →
              </Button>
            </div>
            <div className={styles.eventsList}>
              {upcomingEvents.map((event) => (
                <EventCountdown key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Modal isOpen={showAddChild} onClose={() => setShowAddChild(false)} title="Add Little Bee">
        <div className={styles.addForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Enter name..."
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Birthday</label>
            <input
              type="date"
              className={styles.input}
              value={newChildBirthday}
              onChange={(e) => setNewChildBirthday(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Choose Avatar</label>
            <div className={styles.avatarGrid}>
              {ANIMAL_AVATARS.map(({ emoji, name }) => (
                <button
                  key={emoji}
                  type="button"
                  className={`${styles.avatarOption} ${newChildAvatar === emoji ? styles.avatarSelected : ''}`}
                  onClick={() => setNewChildAvatar(emoji)}
                  title={name}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="large" fullWidth onClick={handleAddChild}>
            Add Bee 🐝
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className={styles.settingsForm}>
          {children.length > 0 && (
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>🐝 Manage Kids</h3>
              <div className={styles.kidsList}>
                {children.map((child) => (
                  <div key={child.id} className={styles.kidsListItem}>
                    <span className={styles.kidsListAvatar}>{child.avatar}</span>
                    <span className={styles.kidsListName}>{child.name}</span>
                    {child.birthday && <span className={styles.kidsListBirthday}>🎂 {formatBirthday(child.birthday)}</span>}
                    <button
                      className={styles.kidsListDelete}
                      onClick={() => {
                        if (window.confirm(`Remove ${child.name}? This will delete all their data.`)) {
                          deleteChild(child.id);
                          if (selectedChildId === child.id) setSelectedChildId(null);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="accent" size="small" onClick={() => { setShowSettings(false); setShowAddChild(true); }}>
                + Add Kid
              </Button>
            </div>
          )}

          <div className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>🎉 Daily Fun</h3>
            <p className={styles.settingsDescription}>
              Choose what fun thing your little bees see each day!
            </p>
            <div className={styles.dailyFunCategoryGrid}>
              {DAILY_FUN_CATEGORIES.map(({ id, emoji, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.dailyFunCategoryOption} ${settings.dailyFunCategory === id ? styles.dailyFunCategorySelected : ''}`}
                  onClick={() => setDailyFunCategory(id)}
                >
                  <span className={styles.dailyFunCategoryEmoji}>{emoji}</span>
                  <span className={styles.dailyFunCategoryLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>👤 Account</h3>
            <p className={styles.settingsDescription}>
              Logged in as {user?.email}
            </p>
            <Button
              variant="secondary"
              size="small"
              onClick={async () => {
                await signOut();
                setShowSettings(false);
              }}
            >
              🚪 Log Out
            </Button>
          </div>

          <div className={styles.settingsSection}>
            <h3 className={styles.settingsSectionTitle}>💛 Credits</h3>
            <p className={styles.settingsDescription}>
              Achievement stickers by{' '}
              <a href="https://www.flaticon.com/free-stickers/winning-star" target="_blank" rel="noreferrer">
                Stickers
              </a>{' '}
              on{' '}
              <a href="https://www.flaticon.com/" target="_blank" rel="noreferrer">
                Flaticon
              </a>
            </p>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!selectedChild} 
        onClose={() => setSelectedChildId(null)} 
        title={selectedChild ? `${selectedChild.avatar} ${selectedChild.name}'s Activity` : ''}
        size="wide"
      >
        {selectedChild && (
          <div className={styles.childModal}>
            <div className={styles.childModalLeft}>
              <HoneyJar honey={getChildTodayHoney(selectedChild.id)} />
            </div>
            <div className={styles.childModalActivity}>
              <h3 className={styles.childModalSubtitle}>Log Activity</h3>
              <BehaviorButtons childId={selectedChild.id} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
