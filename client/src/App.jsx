import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/auth";
const PROFILE_URL = "http://localhost:5000/api/users/me";
const USERS_URL = "http://localhost:5000/api/users";
const CONNECTIONS_URL = "http://localhost:5000/api/connections";
const NOTIFICATIONS_URL = "http://localhost:5000/api/notifications";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "student",
};

const emptyProfile = {
  name: "",
  bio: "",
  skills: "",
  experience: "",
  location: "",
};

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("skillconnect_token") || "",
  );
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [page, setPage] = useState("home");
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [discoverRole, setDiscoverRole] = useState("");
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState("");

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleProfileChange(event) {
    setProfileForm({
      ...profileForm,
      [event.target.name]: event.target.value,
    });
  }

  function loadProfileForm(user) {
    setProfileForm({
      name: user.name || "",
      bio: user.bio || "",
      skills: (user.skills || []).join(", "),
      experience: user.experience || "",
      location: user.location || "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin ? { email: form.email, password: form.password } : form,
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }

      if (isLogin) {
        const profileResponse = await fetch(PROFILE_URL, {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        });

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          setMessage(profileData.message || "Could not load your profile.");
          return;
        }

        setToken(data.token);
        localStorage.setItem("skillconnect_token", data.token);
        setCurrentUser(profileData.user);
        loadProfileForm(profileData.user);
        setPage("dashboard");
        setMessage("");
      } else {
        setMessage("Registration successful! You can now log in.");
        setIsLogin(true);
        setForm({ ...emptyForm, email: form.email });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(
        "Cannot connect to the server. Make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(PROFILE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          bio: profileForm.bio,
          skills: profileForm.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          experience: profileForm.experience,
          location: profileForm.location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not save your profile.");
        return;
      }

      setCurrentUser(data.user);
      loadProfileForm(data.user);
      setPage("dashboard");
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function openAuth(loginMode) {
    setIsLogin(loginMode);
    setForm(emptyForm);
    setMessage("");
    setPage("auth");
  }

  function goToDashboard() {
    setMessage("");
    setPage(currentUser ? "dashboard" : "home");
  }

  async function loadDiscoverUsers(
    searchValue = discoverSearch,
    roleValue = discoverRole,
  ) {
    if (!token) {
      setDiscoverError("Please log in to discover members.");
      return;
    }

    setDiscoverLoading(true);
    setDiscoverError("");

    try {
      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      if (roleValue) {
        params.set("role", roleValue);
      }

      const response = await fetch(`${USERS_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load members.");
      }

      const connectionsResponse = await fetch(CONNECTIONS_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const connectionsData = await connectionsResponse.json();

      if (!connectionsResponse.ok) {
        throw new Error(
          connectionsData.message || "Could not load connection statuses.",
        );
      }

      const myConnections = connectionsData.connections || [];
      const myUserId = currentUser?.id || currentUser?._id;

      const usersWithStatus = (data.users || []).map((member) => {
        const existingConnection = myConnections.find((connection) => {
          const senderId =
            typeof connection.sender === "object"
              ? connection.sender?._id
              : connection.sender;

          const receiverId =
            typeof connection.receiver === "object"
              ? connection.receiver?._id
              : connection.receiver;

          return (
            (senderId === member.id && receiverId === myUserId) ||
            (senderId === myUserId && receiverId === member.id)
          );
        });

        return {
          ...member,
          connectionStatus: existingConnection?.status || "",
        };
      });

      setDiscoverUsers(usersWithStatus);
    } catch (error) {
      console.error("Discover members error:", error);
      setDiscoverError(error.message || "Could not connect to the server.");
    } finally {
      setDiscoverLoading(false);
    }
  }

  function openDiscover() {
    setPage("discover");
    loadDiscoverUsers("", "");
    setDiscoverSearch("");
    setDiscoverRole("");
  }

  async function loadConnections() {
    if (!token) return;

    setConnectionsLoading(true);
    setConnectionsError("");

    try {
      const response = await fetch(CONNECTIONS_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load connections.");
      }

      setConnections(data.connections || []);
    } catch (error) {
      console.error("Load connections error:", error);
      setConnectionsError(error.message || "Could not load connections.");
    } finally {
      setConnectionsLoading(false);
    }
  }

  function openConnections() {
    setPage("connections");
    loadConnections();
  }

  async function updateConnectionStatus(connectionId, status) {
    setConnectionsError("");

    try {
      const response = await fetch(`${CONNECTIONS_URL}/${connectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update request.");
      }

      await loadConnections();
    } catch (error) {
      console.error("Update connection error:", error);
      setConnectionsError(error.message || "Could not update request.");
    }
  }

  async function sendConnectionRequest(memberId) {
    if (!token) {
      setDiscoverError("Please log in to connect with members.");
      return;
    }

    setDiscoverError("");

    try {
      const response = await fetch(`${CONNECTIONS_URL}/${memberId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          await loadDiscoverUsers(discoverSearch, discoverRole);
          setDiscoverError(
            data.message || "A connection request already exists.",
          );
          return;
        }

        throw new Error(data.message || "Could not send connection request.");
      }

      setDiscoverUsers((previousUsers) =>
        previousUsers.map((member) =>
          member.id === memberId
            ? { ...member, connectionStatus: "pending" }
            : member,
        ),
      );

      setMessage("Connection request sent successfully!");
    } catch (error) {
      console.error("Connection request error:", error);
      setDiscoverError(error.message || "Could not send connection request.");
    }
  }

  function editProfile() {
    loadProfileForm(currentUser);
    setMessage("");
    setPage("profile");
  }

  function logout() {
    setToken("");
    localStorage.removeItem("skillconnect_token");
    setCurrentUser(null);
    setForm(emptyForm);
    setProfileForm(emptyProfile);
    setMessage("");
    setPage("home");
  }

  const initials = currentUser?.name
    ? currentUser.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "SC";

  useEffect(() => {
    const savedToken = localStorage.getItem("skillconnect_token");

    if (!savedToken) return;

    async function restoreSession() {
      try {
        const response = await fetch(PROFILE_URL, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          localStorage.removeItem("skillconnect_token");
          setToken("");
          return;
        }

        setToken(savedToken);
        setCurrentUser(data.user);
        loadProfileForm(data.user);
        setPage("dashboard");
      } catch (error) {
        console.error("Session restore error:", error);
        // Keep the saved token so a temporary network failure
        // does not unnecessarily log the user out.
      }
    }

    restoreSession();
  }, []);

  async function loadNotifications() {
    if (!token) return;

    setNotificationsLoading(true);

    try {
      const response = await fetch(NOTIFICATIONS_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load notifications.");
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function markNotificationRead(notificationId) {
    try {
      const response = await fetch(
        `${NOTIFICATIONS_URL}/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not mark notification as read.");
      }

      await loadNotifications();
    } catch (error) {
      console.error("Mark notification read error:", error);
    }
  }

  async function markAllNotificationsRead() {
    try {
      const response = await fetch(`${NOTIFICATIONS_URL}/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not mark notifications as read.",
        );
      }

      await loadNotifications();
    } catch (error) {
      console.error("Mark all notifications read error:", error);
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="navbar">
        <button
          className="brand"
          onClick={goToDashboard}
          aria-label="SkillConnect home"
        >
          <span className="brand-mark">S</span>
          <span>
            skill<span className="brand-light">connect</span>
          </span>
        </button>

        <div className="nav-links">
          <button
            className={page === "home" ? "nav-item active" : "nav-item"}
            onClick={goToDashboard}
          >
            Home
          </button>
          <button
            className={page === "discover" ? "nav-item active" : "nav-item"}
            onClick={() => {
              if (!currentUser) {
                openAuth(true);
              } else {
                openDiscover();
              }
            }}
          >
            Explore
          </button>
          {currentUser ? (
            <>
              <button
                className={
                  page === "connections" ? "nav-item active" : "nav-item"
                }
                onClick={openConnections}
              >
                Connections
              </button>

              <button
                className={
                  page === "notifications" ? "nav-item active" : "nav-item"
                }
                onClick={() => {
                  setPage("notifications");
                  loadNotifications();
                }}
              >
                <span className="notification-bell">Notifications</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <button className="nav-item" onClick={editProfile}>
                Edit profile
              </button>
              <button className="nav-logout" onClick={logout}>
                Log out
              </button>
              <button
                className="nav-avatar"
                onClick={() => setPage("dashboard")}
                title="Your dashboard"
              >
                {initials}
              </button>
            </>
          ) : (
            <>
              <button className="nav-item" onClick={() => openAuth(true)}>
                Log in
              </button>
              <button
                className="button button-primary nav-cta"
                onClick={() => openAuth(false)}
              >
                Get started <span aria-hidden="true">↗</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {page === "home" && (
        <>
          <main className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="status-dot" />
                YOUR NEXT CONNECTION STARTS HERE
              </div>

              <h1>
                Your skills.
                <br />
                Your people.
                <br />
                <span className="gradient-text">Your next chapter.</span>
              </h1>

              <p className="hero-description">
                Meet people who know what you want to learn. Share what you
                know. Build something meaningful together.
              </p>

              <div className="hero-actions">
                <button
                  className="button button-primary button-large"
                  onClick={() => openAuth(false)}
                >
                  Find your community <span aria-hidden="true">↗</span>
                </button>
                <button
                  className="button button-ghost button-large"
                  onClick={() => openAuth(true)}
                >
                  I already have an account <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="hero-proof">
                <div className="proof-avatars">
                  <span>J</span>
                  <span>A</span>
                  <span>M</span>
                  <span>+</span>
                </div>
                <div>
                  <strong>Made for people who grow</strong>
                  <p>Learn together. Move forward.</p>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-orbit orbit-one" />
              <div className="visual-orbit orbit-two" />
              <div className="visual-glow" />

              <div className="floating-chip chip-top">
                <span className="chip-icon purple">✳</span>
                <span>
                  <strong>Learn something new</strong>
                  <small>One connection at a time</small>
                </span>
              </div>

              <div className="showcase-card">
                <div className="showcase-top">
                  <span className="tiny-label">THE SKILLCONNECT COMMUNITY</span>
                  <span className="live-pill">
                    <span /> OPEN TO GROW
                  </span>
                </div>
                <div className="showcase-heading">
                  <h2>Good things happen when skills connect.</h2>
                  <p>Your next collaborator could be one introduction away.</p>
                </div>

                <div className="connection-graphic">
                  <div className="person-node person-left">
                    <span className="person-emoji">✦</span>
                    <strong>Learn</strong>
                    <small>Ask & explore</small>
                  </div>
                  <div className="connection-line">
                    <span>↔</span>
                  </div>
                  <div className="person-node person-right">
                    <span className="person-emoji">✧</span>
                    <strong>Share</strong>
                    <small>Teach & build</small>
                  </div>
                </div>

                <div className="showcase-bottom">
                  <span className="bottom-spark">✦</span>
                  <span>Curiosity brings us together.</span>
                  <span className="bottom-arrow">↗</span>
                </div>
              </div>

              <div className="floating-chip chip-bottom">
                <span className="chip-icon blue">⌘</span>
                <span>
                  <strong>Skills meet opportunity</strong>
                  <small>Make your next move</small>
                </span>
              </div>
            </div>
          </main>

          <section className="value-section">
            <div className="section-intro">
              <span className="eyebrow">A COMMUNITY BUILT AROUND YOU</span>
              <h2>
                There’s more than one way to{" "}
                <span className="gradient-text">grow.</span>
              </h2>
              <p>
                Bring your curiosity. Find your people. Start from wherever you
                are.
              </p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-icon icon-violet">⌕</div>
                <span className="feature-number">01 / DISCOVER</span>
                <h3>Find your people</h3>
                <p>
                  Connect with learners, creators, and skilled people who share
                  your interests.
                </p>
                <span className="feature-link">
                  Explore the community <span>↗</span>
                </span>
              </article>
              <article className="feature-card">
                <div className="feature-icon icon-blue">✳</div>
                <span className="feature-number">02 / SHARE</span>
                <h3>Make your skills count</h3>
                <p>
                  Show what you know, describe your experience, and let your
                  strengths shine.
                </p>
                <span className="feature-link">
                  Build your profile <span>↗</span>
                </span>
              </article>
              <article className="feature-card">
                <div className="feature-icon icon-pink">↗</div>
                <span className="feature-number">03 / GROW</span>
                <h3>Move forward together</h3>
                <p>
                  Start conversations, exchange knowledge, and find your next
                  opportunity.
                </p>
                <span className="feature-link">
                  Start growing <span>↗</span>
                </span>
              </article>
            </div>
          </section>

          <section className="bottom-cta">
            <div>
              <span className="eyebrow">YOUR NEXT CHAPTER AWAITS</span>
              <h2>
                Bring your skills.
                <br />
                <span className="gradient-text">Leave room to grow.</span>
              </h2>
            </div>
            <button
              className="button button-primary button-large"
              onClick={() => openAuth(false)}
            >
              Join SkillConnect <span>↗</span>
            </button>
          </section>
        </>
      )}

      {page === "auth" && (
        <main className="auth-page">
          <div className="auth-aside">
            <span className="eyebrow">
              <span className="status-dot" /> YOUR COMMUNITY, YOUR PACE
            </span>
            <h1>
              Better things
              <br />
              happen <span className="gradient-text">together.</span>
            </h1>
            <p>
              Every expert was once a beginner. Find the people who help you
              take the next step.
            </p>
            <div className="auth-aside-note">
              <span className="quote-mark">“</span>
              <p>Share what you know. Stay curious about what you don't.</p>
              <span className="quote-author">THE SKILLCONNECT MINDSET</span>
            </div>
          </div>

          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="form-brand-mark">S</div>
            <span className="eyebrow">
              {isLogin ? "WELCOME BACK" : "YOUR JOURNEY STARTS HERE"}
            </span>
            <h2>{isLogin ? "Good to see you." : "Join the community."}</h2>
            <p className="form-subtitle">
              {isLogin
                ? "Log in and pick up where you left off."
                : "Create your account and meet your people."}
            </p>

            {!isLogin && (
              <>
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="How should we call you?"
                  autoComplete="name"
                  required
                />

                <label htmlFor="role">I’m joining as</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="student">Student</option>
                  <option value="worker">Skilled worker</option>
                  <option value="employer">Employer</option>
                </select>
              </>
            )}

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={8}
              required
            />

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="button button-primary submit-btn"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Log in to SkillConnect"
                  : "Create my account"}
              {!loading && <span>↗</span>}
            </button>

            <p className="auth-switch">
              {isLogin ? "New around here?" : "Already part of the community?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
              >
                {isLogin ? "Create an account" : "Log in"}
              </button>
            </p>

            <button
              type="button"
              className="back-btn"
              onClick={() => {
                setPage("home");
                setMessage("");
              }}
            >
              ← Back to home
            </button>
          </form>
        </main>
      )}

      {page === "dashboard" && currentUser && (
        <main className="dashboard-page">
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">
                <span className="status-dot" /> YOUR SKILLCONNECT SPACE
              </span>
              <h1>
                Welcome back,{" "}
                <span className="gradient-text">
                  {currentUser.name.split(" ")[0]}.
                </span>
              </h1>
              <p>
                Your skills are a starting point. Let’s see where they take you.
              </p>
            </div>
            <button className="button button-primary" onClick={editProfile}>
              Edit my profile <span>↗</span>
            </button>
          </div>

          {message && (
            <p className="notice-message" role="status">
              {message}
            </p>
          )}

          <div className="dashboard-grid">
            <section className="panel profile-overview">
              <div className="panel-topline">
                <span>YOUR PROFILE</span>
                <span className="panel-status">● MEMBER</span>
              </div>
              <div className="profile-identity">
                <div className="profile-avatar">{initials}</div>
                <div>
                  <h2>{currentUser.name}</h2>
                  <p>
                    {currentUser.role === "worker"
                      ? "Skilled worker"
                      : currentUser.role === "employer"
                        ? "Employer"
                        : "Student"}
                  </p>
                </div>
              </div>
              <div className="profile-detail">
                <span>Email</span>
                <strong>{currentUser.email}</strong>
              </div>
              <div className="profile-detail">
                <span>Location</span>
                <strong>{currentUser.location || "Add your location"}</strong>
              </div>
              <div className="profile-detail">
                <span>Profile status</span>
                <strong className="status-highlight">
                  {currentUser.bio && currentUser.skills?.length
                    ? "Taking shape"
                    : "Ready to build"}
                </strong>
              </div>
              <button
                className="button button-secondary full-width"
                onClick={editProfile}
              >
                Update profile details <span>→</span>
              </button>
            </section>

            <section className="panel profile-content">
              <div className="panel-topline">
                <span>YOUR INTRODUCTION</span>
                <span className="subtle-label">01</span>
              </div>
              <h2>A little about you</h2>
              <p className="profile-bio">
                {currentUser.bio ||
                  "Your story starts here. Add a short bio to help the community get to know you."}
              </p>

              <div className="content-divider" />

              <div className="panel-section-heading">
                <h3>Skills & strengths</h3>
                <button className="text-action" onClick={editProfile}>
                  Edit ↗
                </button>
              </div>
              <div className="skill-tags">
                {currentUser.skills?.length ? (
                  currentUser.skills.map((skill, index) => (
                    <span className="skill-tag" key={`${skill}-${index}`}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="empty-hint">
                    Add skills you want to share with others.
                  </span>
                )}
              </div>

              <div className="content-divider" />

              <div className="panel-section-heading">
                <h3>Experience & projects</h3>
                <button className="text-action" onClick={editProfile}>
                  Edit ↗
                </button>
              </div>
              <p className="profile-bio">
                {currentUser.experience ||
                  "Your projects and experience will appear here."}
              </p>
            </section>

            <section className="panel next-step-panel">
              <span className="eyebrow">YOUR NEXT STEP</span>
              <div className="next-step-icon">✦</div>
              <h2>Make your profile yours.</h2>
              <p>
                A clear bio and a few skills help people understand what you
                bring to the community.
              </p>
              <button
                className="button button-primary full-width"
                onClick={editProfile}
              >
                Complete your profile <span>↗</span>
              </button>
            </section>
          </div>
        </main>
      )}

      {page === "discover" && currentUser && (
        <main className="discover-page">
          <div className="discover-heading">
            <span className="eyebrow">
              <span className="status-dot" /> THE SKILLCONNECT COMMUNITY
            </span>
            <h1>
              Find your <span className="gradient-text">people.</span>
            </h1>
            <p>
              Discover learners, skilled workers, and employers. Your next
              connection could start with a shared skill.
            </p>
          </div>

          <section className="discover-toolbar panel">
            <div className="discover-search">
              <label htmlFor="discover-search">Search the community</label>
              <input
                id="discover-search"
                type="search"
                value={discoverSearch}
                onChange={(event) => setDiscoverSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadDiscoverUsers(discoverSearch, discoverRole);
                  }
                }}
                placeholder="Try Java, React, Jaipur..."
              />
            </div>

            <div className="discover-filter">
              <label htmlFor="discover-role">Member type</label>
              <select
                id="discover-role"
                value={discoverRole}
                onChange={(event) => {
                  setDiscoverRole(event.target.value);
                  loadDiscoverUsers(discoverSearch, event.target.value);
                }}
              >
                <option value="">Everyone</option>
                <option value="student">Students</option>
                <option value="worker">Skilled workers</option>
                <option value="employer">Employers</option>
              </select>
            </div>

            <button
              className="button button-primary discover-search-button"
              onClick={() => loadDiscoverUsers(discoverSearch, discoverRole)}
              disabled={discoverLoading}
            >
              {discoverLoading ? "Searching..." : "Search members"}
            </button>
          </section>

          {discoverError && (
            <p className="notice-message" role="alert">
              {discoverError}
            </p>
          )}

          <div className="discover-results-heading">
            <div>
              <h2>People to know</h2>
              <p>Profiles from across the community</p>
            </div>
            {!discoverLoading && (
              <span className="subtle-label">
                {discoverUsers.length}{" "}
                {discoverUsers.length === 1 ? "member" : "members"}
              </span>
            )}
          </div>

          {discoverLoading ? (
            <div className="panel discover-empty">
              <h3>Finding your community...</h3>
              <p>Looking for people and skills that match.</p>
            </div>
          ) : discoverUsers.length > 0 ? (
            <div className="discover-grid">
              {discoverUsers.map((member) => {
                const memberInitials = (member.name || "SC")
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();

                return (
                  <article className="panel member-card" key={member.id}>
                    <div className="member-card-top">
                      <div className="profile-avatar">{memberInitials}</div>
                      <span className="member-role">
                        {member.role === "worker"
                          ? "Skilled worker"
                          : member.role === "employer"
                            ? "Employer"
                            : "Student"}
                      </span>
                    </div>

                    <h3>{member.name}</h3>
                    <p className="member-location">
                      {member.location || "Location not added"}
                    </p>

                    <p className="member-bio">
                      {member.bio ||
                        "This member is still building their introduction."}
                    </p>

                    <div className="content-divider" />

                    <span className="member-skills-label">
                      SKILLS & STRENGTHS
                    </span>
                    <div className="skill-tags">
                      {member.skills?.length ? (
                        member.skills.map((skill, index) => (
                          <span className="skill-tag" key={`${skill}-${index}`}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="empty-hint">Skills not added yet</span>
                      )}
                    </div>

                    {member.experience && (
                      <p className="member-experience">{member.experience}</p>
                    )}
                    <button
                      className="button button-primary full-width member-connect-button"
                      disabled={member.connectionStatus === "pending"}
                      onClick={() => sendConnectionRequest(member.id)}
                    >
                      {member.connectionStatus === "pending"
                        ? "Request sent"
                        : "Connect →"}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="panel discover-empty">
              <div className="next-step-icon">⌕</div>
              <h3>No members found</h3>
              <p>Try another name, skill, location, or member type.</p>
              <button
                className="button button-secondary"
                onClick={() => {
                  setDiscoverSearch("");
                  setDiscoverRole("");
                  loadDiscoverUsers("", "");
                }}
              >
                Show everyone
              </button>
            </div>
          )}
        </main>
      )}

      {page === "connections" && currentUser && (
        <main className="discover-page">
          <div className="discover-heading">
            <span className="eyebrow">
              <span className="status-dot" /> YOUR NETWORK
            </span>
            <h1>
              Your <span className="gradient-text">connections.</span>
            </h1>
            <p>
              Manage incoming requests, check outgoing requests, and see the
              people you've connected with.
            </p>
          </div>

          {connectionsError && (
            <p className="notice-message" role="alert">
              {connectionsError}
            </p>
          )}

          {connectionsLoading ? (
            <div className="panel discover-empty">
              <h3>Loading your connections...</h3>
            </div>
          ) : (
            <>
              <div className="discover-results-heading">
                <div>
                  <h2>Connection requests</h2>
                  <p>Review requests and grow your network.</p>
                </div>
                <button
                  className="button button-secondary"
                  onClick={loadConnections}
                >
                  Refresh
                </button>
              </div>

              {connections.length === 0 ? (
                <div className="panel discover-empty">
                  <h3>No connection requests yet</h3>
                  <p>Visit Explore to discover people and send a request.</p>
                  <button
                    className="button button-primary"
                    onClick={openDiscover}
                  >
                    Explore people →
                  </button>
                </div>
              ) : (
                <div className="discover-grid">
                  {connections.map((connection) => {
                    const myId = currentUser.id || currentUser._id;

                    const senderId =
                      typeof connection.sender === "object"
                        ? connection.sender?._id
                        : connection.sender;

                    const receiverId =
                      typeof connection.receiver === "object"
                        ? connection.receiver?._id
                        : connection.receiver;

                    const incoming = receiverId === myId;
                    const member = incoming
                      ? connection.sender
                      : connection.receiver;

                    const memberName =
                      typeof member === "object" ? member?.name : "Member";

                    return (
                      <article
                        className="panel member-card"
                        key={connection._id}
                      >
                        <div className="member-card-top">
                          <div className="profile-avatar">
                            {(memberName || "SC")
                              .trim()
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span className="member-role">
                            {connection.status === "pending"
                              ? incoming
                                ? "Incoming request"
                                : "Request sent"
                              : connection.status === "accepted"
                                ? "Connected"
                                : "Rejected"}
                          </span>
                        </div>

                        <h3>{memberName}</h3>
                        <p className="member-location">
                          {typeof member === "object"
                            ? member?.location || "Location not added"
                            : ""}
                        </p>

                        <p className="member-bio">
                          {typeof member === "object"
                            ? member?.bio || "No introduction added yet."
                            : ""}
                        </p>

                        {connection.status === "pending" && incoming && (
                          <div className="connection-actions">
                            <button
                              className="button button-primary"
                              disabled={connectionsLoading}
                              onClick={() =>
                                updateConnectionStatus(
                                  connection._id,
                                  "accepted",
                                )
                              }
                            >
                              Accept
                            </button>
                            <button
                              className="button button-secondary"
                              disabled={connectionsLoading}
                              onClick={() =>
                                updateConnectionStatus(
                                  connection._id,
                                  "rejected",
                                )
                              }
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {typeof member === "object" &&
                          member?.skills?.length > 0 && (
                            <div className="skill-tags">
                              {member.skills.map((skill, index) => (
                                <span
                                  className="skill-tag"
                                  key={`${skill}-${index}`}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      )}

      {page === "notifications" && currentUser && (
        <main className="discover-page">
          <div className="discover-heading">
            <span className="eyebrow">
              <span className="status-dot" /> YOUR ACTIVITY
            </span>
            <h1>
              Your <span className="gradient-text">notifications.</span>
            </h1>
            <p>Stay updated when people connect with you on SkillConnect.</p>
          </div>

          <div className="discover-results-heading">
            <div>
              <h2>Recent activity</h2>
              <p>
                {unreadCount} unread notification
                {unreadCount === 1 ? "" : "s"}
              </p>
            </div>
            <button
              className="button button-secondary"
              onClick={markAllNotificationsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          {notificationsLoading ? (
            <div className="panel discover-empty">
              <h3>Loading notifications...</h3>
            </div>
          ) : notifications.length === 0 ? (
            <div className="panel discover-empty">
              <h3>You're all caught up!</h3>
              <p>
                When someone sends you a connection request or accepts yours,
                you'll see it here.
              </p>
              <button className="button button-primary" onClick={openDiscover}>
                Explore people →
              </button>
            </div>
          ) : (
            <div className="discover-grid">
              {notifications.map((notification) => (
                <article className="panel member-card" key={notification._id}>
                  <div className="member-card-top">
                    <div className="profile-avatar">
                      {(notification.actor?.name || "SC")
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <span className="member-role">
                      {notification.isRead ? "Read" : "New"}
                    </span>
                  </div>

                  <h3>{notification.actor?.name || "A SkillConnect member"}</h3>
                  <p className="member-bio">{notification.message}</p>

                  {!notification.isRead && (
                    <div className="connection-actions">
                      <button
                        className="button button-secondary"
                        onClick={() => markNotificationRead(notification._id)}
                      >
                        Mark as read
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </main>
      )}

      {page === "profile" && currentUser && (
        <main className="profile-page">
          <button
            className="back-link"
            onClick={() => {
              loadProfileForm(currentUser);
              setMessage("");
              setPage("dashboard");
            }}
          >
            ← Back to dashboard
          </button>

          <div className="profile-page-heading">
            <span className="eyebrow">YOUR PROFILE, YOUR STORY</span>
            <h1>
              Make it <span className="gradient-text">yours.</span>
            </h1>
            <p>
              Help people understand your skills, experience, and what you're
              interested in.
            </p>
          </div>

          <form className="profile-form panel" onSubmit={saveProfile}>
            <div className="form-section-heading">
              <div className="section-icon">01</div>
              <div>
                <h2>About you</h2>
                <p>Start with the basics.</p>
              </div>
            </div>

            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              maxLength={100}
              required
            />

            <label htmlFor="bio">A short introduction</label>
            <textarea
              id="bio"
              name="bio"
              value={profileForm.bio}
              onChange={handleProfileChange}
              placeholder="What are you passionate about? What are you working toward?"
              maxLength={500}
              rows={4}
            />
            <div className="field-hint">
              {profileForm.bio.length}/500 characters
            </div>

            <div className="content-divider" />

            <div className="form-section-heading">
              <div className="section-icon">02</div>
              <div>
                <h2>Your strengths</h2>
                <p>What can you bring to the table?</p>
              </div>
            </div>

            <label htmlFor="skills">Skills</label>
            <input
              id="skills"
              name="skills"
              value={profileForm.skills}
              onChange={handleProfileChange}
              placeholder="Java, React, UI design"
            />
            <div className="field-hint">Separate each skill with a comma.</div>

            <label htmlFor="experience">Experience & projects</label>
            <textarea
              id="experience"
              name="experience"
              value={profileForm.experience}
              onChange={handleProfileChange}
              placeholder="Share projects, experience, or things you're learning..."
              maxLength={1000}
              rows={5}
            />
            <div className="field-hint">
              {profileForm.experience.length}/1000 characters
            </div>

            <div className="content-divider" />

            <div className="form-section-heading">
              <div className="section-icon">03</div>
              <div>
                <h2>Where to find you</h2>
                <p>A little context for your community.</p>
              </div>
            </div>

            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              value={profileForm.location}
              onChange={handleProfileChange}
              placeholder="City or region"
              maxLength={100}
            />

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={loading}
                onClick={() => {
                  loadProfileForm(currentUser);
                  setMessage("");
                  setPage("dashboard");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={loading}
              >
                {loading ? "Saving your changes..." : "Save changes"}{" "}
                {!loading && <span>↗</span>}
              </button>
            </div>
          </form>
        </main>
      )}

      <footer className="footer">
        <button className="footer-brand" onClick={goToDashboard}>
          <span className="brand-mark">S</span> skillconnect
        </button>
        <p>Made for people who grow together.</p>
        <span>CONNECT · LEARN · GROW</span>
      </footer>
    </div>
  );
}

export default App;
