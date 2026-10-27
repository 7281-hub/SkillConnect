import { useEffect, useState } from "react";
import "./workerProfile.css";

const API_URL = "http://localhost:5000/api/worker-profile";

function WorkerProfile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    skills: [],
    experience: "",
    location: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("skillconnect_token");

    if (!token) {
      setMessage("Please log in to view your profile.");
      setLoading(false);
      return;
    }

    fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to load profile");
        return data;
      })
      .then((data) => {
        setProfile(data.user);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();

    if (
      skill &&
      !profile.skills.some(
        (existing) => existing.toLowerCase() === skill.toLowerCase(),
      )
    ) {
      setProfile((current) => ({
        ...current,
        skills: [...current.skills, skill],
      }));
    }

    setSkillInput("");
  };

  const removeSkill = (skillToRemove) => {
    setProfile((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("skillconnect_token");

      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          skills: profile.skills,
          experience: profile.experience,
          location: profile.location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setProfile(data.user);
      setMessage("Profile saved successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="profile-status">Loading profile...</p>;

  return (
    <section className="worker-profile-page">
      <div className="worker-profile-card">
        <h1>Worker Profile</h1>
        <p className="profile-subtitle">
          Manage your details and showcase your skills.
        </p>

        {message && <p className="profile-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email
            <input value={profile.email} readOnly />
          </label>

          <label>
            About You
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              maxLength={500}
              rows={4}
            />
          </label>

          <label>
            Skills
            <div className="skill-entry">
              <input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                placeholder="Enter a skill"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button type="button" onClick={addSkill}>
                Add
              </button>
            </div>
          </label>

          <div className="skill-list">
            {profile.skills.map((skill) => (
              <span className="skill-chip" key={skill}>
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <label>
            Experience
            <textarea
              name="experience"
              value={profile.experience}
              onChange={handleChange}
              maxLength={1000}
              rows={3}
              placeholder="Describe your experience or write Fresher"
            />
          </label>

          <label>
            Location
            <input
              name="location"
              value={profile.location}
              onChange={handleChange}
              maxLength={100}
              placeholder="Enter your city"
            />
          </label>

          <button
            className="profile-save-button"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default WorkerProfile;
