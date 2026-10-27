import { useEffect, useState } from "react";
import "./employerJobs.css";

const API_URL = "http://localhost:5000/api/jobs";

export default function EmployerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    requiredSkills: "",
    location: "",
    jobType: "Full-time",
    experienceLevel: "Fresher",
    salary: "",
  });

  const token = localStorage.getItem("skillconnect_token");

  async function loadJobs() {
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load jobs");
      }

      setJobs(data.jobs || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          requiredSkills: form.requiredSkills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not post job");
      }

      setMessage("Job posted successfully!");
      setForm({
        title: "",
        company: "",
        description: "",
        requiredSkills: "",
        location: "",
        jobType: "Full-time",
        experienceLevel: "Fresher",
        salary: "",
      });

      await loadJobs();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="employer-jobs">
      <h2>Employer Job Posting</h2>
      <p>Post opportunities and explore available jobs.</p>

      {message && <p role="status">{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Job title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <input
          name="company"
          placeholder="Company name"
          value={form.company}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Job description"
          value={form.description}
          onChange={handleChange}
          required
        />

        <input
          name="requiredSkills"
          placeholder="Skills (comma-separated)"
          value={form.requiredSkills}
          onChange={handleChange}
        />

        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        />

        <select name="jobType" value={form.jobType} onChange={handleChange}>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Internship</option>
          <option>Contract</option>
        </select>

        <select
          name="experienceLevel"
          value={form.experienceLevel}
          onChange={handleChange}
        >
          <option>Fresher</option>
          <option>Entry-level</option>
          <option>Experienced</option>
        </select>

        <input
          name="salary"
          placeholder="Salary (optional)"
          value={form.salary}
          onChange={handleChange}
        />

        <button type="submit" className="post-job-button">
          Post Job
        </button>
      </form>

      <h3>Available Jobs</h3>

      {loading ? (
        <p>Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p>No open jobs available yet.</p>
      ) : (
        jobs.map((job) => (
          <article key={job._id} className="job-card">
            <h3>{job.title}</h3>
            <p>
              {job.company} · {job.location}
            </p>
            <p>{job.description}</p>
            <p>
              Skills: {(job.requiredSkills || []).join(", ") || "Not specified"}
            </p>
            <p>
              {job.jobType} · {job.experienceLevel} · {job.salary}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
