import "./App.css";
import {
  FaArrowRight,
  FaBriefcase,
  FaCalendarAlt,
  FaDownload,
  FaEnvelope,
  FaGithub,
  FaLinkedin,
  FaMapMarkerAlt,
} from "react-icons/fa";
import resume from "./Files/resume.pdf";

const quickWins = [
  "96% variance reduction in telemetry interpolation",
  "60% lower P99 latency across 15M+ daily records",
  "80% faster profile and asset loading",
  "99% faster restoration for 550+ dashboards",
];

const experience = [
  {
    role: "Operational Technology (Data Engineering) Co-op",
    company: "Elk Valley Resources (a Glencore Company)",
    period: "Jan 2026 - Aug 2026",
    location: "Calgary, Alberta",
    type: "Co-op",
    highlights: [
      "Deployed an enterprise MSSQL/SSIS geospatial interpolation pipeline to synchronize truck telemetry with camera sensors, achieving 100% vehicle identification.",
      "Re-architected Azure Event Hubs ETL pipelines for 15M+ daily records and reduced P99 latency by 60% by migrating Databricks workloads from PySpark to Java.",
      "Built data pipelines for 10,000+ assets and 7,700+ user profiles using ServiceNow and Microsoft Graph APIs, and improved load times by 80% with SQL optimization and Redis caching.",
      "Engineered a disaster recovery workflow with scheduled Azure DevOps pipelines and Grafana API automation, cutting restoration time by 99%.",
    ],
  },
  {
    role: "R&D Intern",
    company: "University of Alberta - Empathetics Lab",
    period: "Apr 2025 - Jan 2026",
    location: "Edmonton, Alberta",
    type: "Internship",
    highlights: [
      "Engineered a high-throughput Python pipeline for 19-channel physiological telemetry, processing 1,000+ messages per minute for real-time monitoring.",
      "Architected a Dockerized microservices backend with MultiThreadedExecutors for CPU-bound ML inference to keep robotics applications responsive and thread-safe.",
      "Built unit, integration, and system test suites to reach 85% code coverage while configuring scalable training pipelines for deep learning workloads.",
    ],
  },
  {
    role: "Robotics Perception Research Intern",
    company: "University of Alberta",
    period: "May 2025 - Aug 2025",
    location: "Edmonton, AB, Canada",
    type: "Internship",
    highlights: [
      "Designed a MuJoCo RL pipeline with custom dense and sparse reward structures, training a UR5e arm via PPO and Stable-Baselines3 for vision-based pick-and-place with a 65% model success rate.",
      "Developed a dual-channel CNN perception system processing 84x84 RGB-D data at 75+ FPS with RealSense D435i simulation, implementing domain randomization and curriculum learning for sim-to-real transfer.",
      "Optimized training across Apple Silicon (M2) and NVIDIA RTX GPUs, enabling stable parallelized RL training while implementing safety and debugging protocols for physics stability.",
    ],
  },
  {
    role: "Software Developer Team Member",
    company: "University of Alberta Aerial Robotics Group",
    period: "Feb 2025 - Apr 2025",
    location: "Edmonton, AB, Canada",
    type: "Part-Time",
    highlights: [
      "Architected a CI/CD pipeline using GitHub Actions and Pytest to automate testing and releases, cutting manual deployment time by 50%.",
      "Developed a Python geospatial pipeline with K-means clustering for flight path coordinates, improving mapping accuracy by 30%.",
      "Engineered a coordinate transformation system and automated image sorting, reducing manual processing time by 40% while improving aircraft positioning precision.",
      "Conducted technical code reviews on GitHub to enforce coding standards and identify logic errors early.",
      "Collaborated in an Agile workflow using Jira for sprint planning and backlog management to deliver features on schedule.",
    ],
  },
];

const projects = [
  {
    name: "CoSim",
    stack:
      "Python, TypeScript, React.js, FastAPI, gRPC, WebRTC, Yjs (CRDT), PostgreSQL, Redis, Docker",
    summary: [
      "Architected a cloud robotics platform for ROS2 control and browser-streamed 3D simulations with sub-800 ms latency under simulated multi-user load.",
      "Engineered a scalable GPU backend with Redis pub/sub, distributed locks, and demand-driven rendering that reduced per-session memory by 60%.",
    ],
  },
  {
    name: "Evaluate",
    stack:
      "Java, TypeScript, Next.js, Spring WebFlux, Hibernate ORM, PostgreSQL, Azure Speech, Ollama",
    summary: [
      "Developed a real-time AI mock interview platform with context-aware feedback in under 2000 ms using Azure Speech and local Ollama inference.",
      "Built a Dockerized CI/CD pipeline with GitHub Actions and JUnit 5 integration tests using MockMvc for reliable API validation.",
    ],
  },
  {
    name: "MacroScope",
    stack:
      "Python, JavaScript, Vue.js, TensorFlow, Django, Nginx, Gunicorn, MySQL, Docker, AWS",
    summary: [
      "Built a full-stack economics analytics platform with authenticated dashboards and LSTM-based forecasting.",
      "Deployed with AWS services (EC2, RDS, S3, CloudFront) and reduced estimated monthly compute cost by 50% via rightsizing and resource tuning.",
    ],
  },
];

const skills = {
  languages: "Python, Java, SQL, C, JavaScript, TypeScript, C#, HTML, CSS",
  frameworks:
    "React, Next.js, Vue.js, Svelte, Django, FastAPI, Flask, Spring Boot, Node.js, ASP.NET, TailwindCSS, PyTorch, TensorFlow, scikit-learn, pandas, NumPy, Matplotlib, PyTest, Selenium",
  tools:
    "AWS, Azure, Databricks, PostgreSQL, MySQL, MSSQL, Linux, Redis, Docker",
};

function App() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="site-shell">
      <div className="ambient orb-coral" aria-hidden="true" />
      <div className="ambient orb-teal" aria-hidden="true" />
      <div className="ambient grid-mask" aria-hidden="true" />

      <header className="top-nav reveal" style={{ "--delay": "40ms" }}>
        <a href="#home" className="brand">
          Ishaan Ratanshi
        </a>
        <nav>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
        </nav>
        <a
          className="nav-resume"
          href={resume}
          target="_blank"
          rel="noopener noreferrer"
        >
          Resume <FaDownload aria-hidden="true" />
        </a>
      </header>

      <main>
        <section id="home" className="section hero reveal" style={{ "--delay": "120ms" }}>
          <div>
            <p className="eyebrow">Computer Science @ University of Alberta</p>
            <h1 className="hero-title">
              I build production-grade data and AI systems that perform under pressure.
            </h1>
            <p className="hero-copy">
              I am a developer focused on full-stack engineering, data pipelines, and intelligent systems.
              My recent work spans Azure event processing, cloud robotics, and real-time AI platforms.
            </p>

            <div className="hero-actions">
              <a href="#contact" className="action action-primary">
                Work with me <FaArrowRight aria-hidden="true" />
              </a>
              <a
                href={resume}
                className="action action-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open resume <FaDownload aria-hidden="true" />
              </a>
            </div>

            <div className="social-row">
              <a
                href="https://github.com/iratansh"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <FaGithub aria-hidden="true" /> GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/ishaan-ratanshi/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <FaLinkedin aria-hidden="true" /> LinkedIn
              </a>
            </div>

            <div className="hero-metrics">
              {quickWins.map((item, index) => (
                <article
                  key={item}
                  className="metric-card reveal"
                  style={{ "--delay": `${260 + index * 90}ms` }}
                >
                  <p className="metric-label">Impact</p>
                  <p className="metric-value">{item}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="hero-spotlight reveal" style={{ "--delay": "220ms" }}>
            <p className="spotlight-label">Now Focused On</p>
            <ul className="spotlight-list">
              <li>Distributed systems with low-latency data flow</li>
              <li>Scalable ETL and event-driven architecture</li>
              <li>Full-stack AI product development</li>
              <li>Production reliability and test automation</li>
            </ul>
            <a
              href="mailto:iratansh@ualberta.ca"
              className="spotlight-mail"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaEnvelope aria-hidden="true" /> iratansh@ualberta.ca
            </a>
          </aside>
        </section>

        <section id="experience" className="section reveal" style={{ "--delay": "120ms" }}>
          <div className="section-header">
            <p className="section-kicker">Experience</p>
            <h2 className="section-title">Real systems. Measurable outcomes.</h2>
          </div>
          <div className="experience-branch">
            {experience.map((job, index) => {
              const branchSide = index % 2 === 0 ? "branch-left" : "branch-right";

              return (
                <article
                  key={job.role}
                  className={`branch-row ${branchSide} reveal`}
                  style={{ "--delay": `${150 + index * 100}ms` }}
                >
                  <div className="branch-center" aria-hidden="true">
                    <span className="branch-dot" />
                  </div>

                  <div className="branch-card">
                    <div className="experience-card">
                      <h3>{job.role}</h3>
                      <p className="card-subtitle">{job.company}</p>
                      <div className="card-meta">
                        <span>
                          <FaCalendarAlt aria-hidden="true" /> {job.period}
                        </span>
                        <span>
                          <FaMapMarkerAlt aria-hidden="true" /> {job.location}
                        </span>
                        {job.type && (
                          <span className="type-tag">
                            <FaBriefcase aria-hidden="true" /> {job.type}
                          </span>
                        )}
                      </div>
                      <ul>
                        {job.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="projects" className="section reveal" style={{ "--delay": "120ms" }}>
          <div className="section-header">
            <p className="section-kicker">Projects</p>
            <h2 className="section-title">Built across AI, cloud, and web platforms</h2>
          </div>
          <div className="project-grid">
            {projects.map((project, index) => (
              <article
                key={project.name}
                className="project-card reveal"
                style={{ "--delay": `${180 + index * 100}ms` }}
              >
                <h3>{project.name}</h3>
                <p className="stack-line">{project.stack}</p>
                <ul>
                  {project.summary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="skills" className="section reveal" style={{ "--delay": "120ms" }}>
          <div className="section-header">
            <p className="section-kicker">Technical Skills</p>
            <h2 className="section-title">Versatile across software, data, and ML stacks</h2>
          </div>
          <div className="skills-grid">
            <article className="skill-card reveal" style={{ "--delay": "190ms" }}>
              <h3>Languages</h3>
              <p>{skills.languages}</p>
            </article>
            <article className="skill-card reveal" style={{ "--delay": "260ms" }}>
              <h3>Frameworks and Libraries</h3>
              <p>{skills.frameworks}</p>
            </article>
            <article className="skill-card reveal" style={{ "--delay": "330ms" }}>
              <h3>Tools and Cloud</h3>
              <p>{skills.tools}</p>
            </article>
          </div>
        </section>

        <section className="section reveal" style={{ "--delay": "120ms" }}>
          <div className="edu-contact-grid">
            <article className="panel-card reveal" style={{ "--delay": "190ms" }}>
              <p className="section-kicker">Education</p>
              <h3>University of Alberta</h3>
              <p>Bachelor of Science in Computer Science</p>
              <div className="pill-list">
                <span className="pill">Expected Graduation: Dec 2027</span>
                <span className="pill">Edmonton, Alberta</span>
              </div>
            </article>

            <article
              id="contact"
              className="panel-card reveal"
              style={{ "--delay": "260ms" }}
            >
              <p className="section-kicker">Contact</p>
              <h3>Let&apos;s build something ambitious.</h3>
              <p>
                I am open to internships, co-ops, and software engineering opportunities in
                full-stack, data engineering, and AI product teams.
              </p>
              <div className="contact-list">
                <a href="mailto:iratansh@ualberta.ca" target="_blank" rel="noopener noreferrer">
                  <FaEnvelope aria-hidden="true" /> iratansh@ualberta.ca
                </a>
                <a
                  href="https://www.linkedin.com/in/ishaan-ratanshi/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin aria-hidden="true" /> linkedin.com/in/ishaan-ratanshi
                </a>
                <a href="https://github.com/iratansh" target="_blank" rel="noopener noreferrer">
                  <FaGithub aria-hidden="true" /> github.com/iratansh
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>Last updated: April 2026</p>
        <p>Copyright {currentYear} Ishaan Ratanshi</p>
      </footer>
    </div>
  );
}

export default App;

