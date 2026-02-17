import React, { useState, useEffect } from 'react';

interface Candidate {
  uuid: string;
  candidateId: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Job {
  id: string;
  title: string;
}

const BASE_URL = "https://botfilter-h5ddh6dye8exb7ha.centralus-01.azurewebsites.net";

const USER_EMAIL = "nazarenaayelen49@gmail.com"; 

export default function App() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Manejo de estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Step 2: Obtener datos de candidato
        const candidateRes = await fetch(`${BASE_URL}/api/candidate/get-by-email?email=${USER_EMAIL}`);
        if (!candidateRes.ok) throw new Error("Error al obtener tus datos de candidato. Revisá el email.");
        const candidateData = await candidateRes.json();
        setCandidate(candidateData);

        // Step 3: Obtener la lista de posiciones abiertas
        const jobsRes = await fetch(`${BASE_URL}/api/jobs/get-list`);
        if (!jobsRes.ok) throw new Error("Error al obtener la lista de posiciones.");
        const jobsData = await jobsRes.json();
        setJobs(jobsData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  if (loading) return <div style={styles.center}>Cargando datos...</div>;
  if (error) return <div style={{...styles.center, color: 'red'}}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h1>Posiciones Abiertas en Nimble Gravity</h1>
      {candidate && (
        <p style={{ marginBottom: '20px' }}>
          Hola, <strong>{candidate.firstName}</strong>. Ingresá el link de tu repo en la posición a la que aplicás:
        </p>
      )}
      
      <div style={styles.jobList}>
        {jobs.map(job => (
          /* Step 4: Listado de posiciones */
          <JobCard key={job.id} job={job} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, candidate }: { job: Job, candidate: Candidate | null }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const handleApply = async () => {
    if (!repoUrl) {
      setErrorMessage("Ingresá la URL de tu repositorio.");
      setSubmitStatus('error');
      return;
    }

    if (!candidate) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage("");

    try {
      const response = await fetch(`${BASE_URL}/api/candidate/apply-to-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: candidate.uuid,
          jobId: job.id,
          candidateId: candidate.candidateId,
          applicationId: candidate.applicationId,
          repoUrl: repoUrl.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json(); 
        
        let errorMsg = "Ocurrió un error al enviar la postulación.";
        if (errorData.details && errorData.details.fieldErrors) {
           const firstError = Object.values(errorData.details.fieldErrors)[0] as string[];
           if (firstError && firstError.length > 0) errorMsg = firstError[0];
        } else if (errorData.error) {
           errorMsg = errorData.error;
        }
        
        throw new Error(errorMsg);
      }

      setSubmitStatus('success');

    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3>{job.title}</h3>
      <div style={styles.formGroup}>
        <input 
          type="url" 
          placeholder="https://github.com/tu-usuario/tu-repo" 
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={isSubmitting || submitStatus === 'success'}
          style={styles.input}
        />
        <button 
          onClick={handleApply} 
          disabled={isSubmitting || submitStatus === 'success'}
          style={{
            ...styles.button,
            backgroundColor: submitStatus === 'success' ? '#28a745' : '#007bff',
            cursor: (isSubmitting || submitStatus === 'success') ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? "Enviando..." : submitStatus === 'success' ? "¡Postulación Enviada!" : "Submit"}
        </button>
      </div>
      {submitStatus === 'error' && <p style={styles.errorText}>{errorMessage}</p>}
    </div>
  );
}

const styles = {
  container: { padding: '30px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  center: { textAlign: 'center' as const, marginTop: '50px', fontFamily: 'system-ui, sans-serif' },
  jobList: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  card: { border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '10px', marginTop: '15px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' },
  button: { padding: '10px', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', transition: '0.2s' },
  errorText: { color: '#dc3545', fontSize: '13px', marginTop: '8px' }
};