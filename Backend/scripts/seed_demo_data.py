"""
PrepShare Synthetic Development & Demo Dataset Generator (Enhanced V2)
======================================================================
Purpose: Seeds coherent, diverse, and realistic synthetic demo data
across 15+ industries (Mechanical, Manufacturing, Finance, Banking,
Civil, Cloud, Semiconductors, ECE, Marketing, Design, Healthcare,
Biotech, Supply Chain, etc.) and all 4 categories:
  1. Campus Placement
  2. Off-Campus Placement
  3. Campus Hackathon
  4. Off-Campus Hackathon

DISCLAIMER: DEMO / DEVELOPMENT DATA ONLY.
Contains no private personal data of real individuals.
"""

import sys
import os
import uuid
import psycopg2
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from _01_core.config import settings

def utc_now():
    return datetime.now(timezone.utc)

def run_seed():
    print("=" * 70, flush=True)
    print("PREPSHARE -- SYNTHETIC DEVELOPMENT & DEMO DATA SEEDING (ENHANCED)", flush=True)
    print("=" * 70, flush=True)

    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        # 1. CLEANUP PREVIOUS DUMMY/TEST POSTS
        print("[1/7] Cleaning legacy dummy posts and random-number test artifacts...", flush=True)
        
        cur.execute("""
            SELECT id FROM interview_posts 
            WHERE title LIKE 'Test Post via Script%' 
               OR title LIKE 'Updated Title%' 
               OR title LIKE 'Public Post For Comments%'
               OR title LIKE 'Confidential Anonymous Staff Architect%'
               OR title LIKE 'Microsoft Senior SDE%'
               OR title LIKE 'Google Principal Infrastructure%'
               OR title LIKE 'Anonymous Senior Staff Evaluation%';
        """)
        dummy_post_ids = [row[0] for row in cur.fetchall()]
        
        if dummy_post_ids:
            cur.execute("DELETE FROM comments WHERE post_id::text = ANY(%s);", (dummy_post_ids,))
            cur.execute("DELETE FROM likes WHERE post_id::text = ANY(%s);", (dummy_post_ids,))
            cur.execute("DELETE FROM bookmarks WHERE post_id::text = ANY(%s);", (dummy_post_ids,))
            cur.execute("DELETE FROM reports WHERE post_id::text = ANY(%s);", (dummy_post_ids,))
            cur.execute("DELETE FROM interview_questions WHERE post_id::text = ANY(%s);", (dummy_post_ids,))
            cur.execute("DELETE FROM post_rounds WHERE post_id::text = ANY(%s);", (dummy_post_ids,))
            cur.execute("DELETE FROM interview_posts WHERE id::text = ANY(%s);", (dummy_post_ids,))
            
        print(f"  Cleaned up {len(dummy_post_ids)} legacy test placeholders.", flush=True)

        # 2. SEED REALISTIC INSTITUTIONS / COLLEGES
        print("[2/7] Seeding institutions and universities...", flush=True)
        institutions_data = [
            ("Nirma University", "Ahmedabad", "Gujarat", "India", "university", "https://nirmauni.ac.in"),
            ("IIT Bombay", "Mumbai", "Maharashtra", "India", "institute", "https://iitb.ac.in"),
            ("IIT Delhi", "New Delhi", "Delhi", "India", "institute", "https://iitd.ac.in"),
            ("BITS Pilani", "Pilani", "Rajasthan", "India", "university", "https://bits-pilani.ac.in"),
            ("COEP Technological University", "Pune", "Maharashtra", "India", "university", "https://coep.org.in"),
            ("Delhi Technological University", "New Delhi", "Delhi", "India", "university", "https://dtu.ac.in"),
            ("Anna University", "Chennai", "Tamil Nadu", "India", "university", "https://annauniv.edu"),
            ("IIM Ahmedabad", "Ahmedabad", "Gujarat", "India", "institute", "https://iima.ac.in"),
            ("Symbiosis International University", "Pune", "Maharashtra", "India", "university", "https://siu.edu.in"),
            ("National Institute of Design (NID)", "Ahmedabad", "Gujarat", "India", "institute", "https://nid.edu"),
            ("AIIMS New Delhi", "New Delhi", "Delhi", "India", "institute", "https://aiims.edu"),
            ("St. Xavier's College", "Mumbai", "Maharashtra", "India", "college", "https://xaviers.edu"),
        ]

        institution_ids = {}
        for iname, icity, istate, icountry, itype, iweb in institutions_data:
            cur.execute("SELECT id FROM institutions WHERE name = %s;", (iname,))
            row = cur.fetchone()
            if row:
                iid = row[0]
            else:
                iid = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO institutions (id, name, city, state, country, type, website, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);",
                    (iid, iname, icity, istate, icountry, itype, iweb, utc_now())
                )
            institution_ids[iname] = iid

        # 3. SEED REALISTIC COMPANIES ACROSS INDUSTRIES
        print("[3/7] Seeding industry-diverse companies...", flush=True)
        companies_data = [
            ("Northstar Manufacturing", "northstar-manufacturing", "Manufacturing & Automotive", "https://northstarmfg.example"),
            ("Meridian Capital", "meridian-capital", "Finance / Investment Banking", "https://meridiancap.example"),
            ("GreenGrid Infrastructure", "greengrid-infrastructure", "Civil & Structural Infrastructure", "https://greengrid.example"),
            ("Tata Motors", "tata-motors", "Automotive & Manufacturing", "https://tatamotors.example"),
            ("Tata Consultancy Services (TCS)", "tata-consultancy-services", "IT & Engineering Services", "https://tcs.example"),
            ("Apex Capital Partners", "apex-capital-partners", "Finance / Valuation & M&A", "https://apexcapital.example"),
            ("Google Cloud", "google-cloud", "Technology / Cloud Infrastructure", "https://cloud.google.com"),
            ("NVIDIA", "nvidia-corp", "Semiconductors & Deep Learning", "https://nvidia.example"),
            ("Larsen & Toubro", "larsen-toubro", "Civil & Structural Infrastructure", "https://larsentoubro.example"),
            ("Qualcomm Technologies", "qualcomm-technologies", "Semiconductors & Hardware / ECE", "https://qualcomm.example"),
            ("Razorpay", "razorpay-payments", "Fintech & Growth Marketing", "https://razorpay.example"),
            ("CRED", "cred-design", "Product Design & Consumer Fintech", "https://cred.example"),
            ("Swiggy", "swiggy-tech", "Consumer Internet & Logistics", "https://swiggy.example"),
            ("Apollo Healthcare Systems", "apollo-healthcare", "Healthcare & Hospital Operations", "https://apollohealthcare.example"),
            ("Biocon Biologics", "biocon-biologics", "Biotechnology & Healthcare", "https://biocon.example"),
            ("Amazon Operations", "amazon-operations", "Supply Chain & Operations", "https://amazonops.example")
        ]

        company_ids = {}
        for name, slug, industry, web in companies_data:
            cur.execute("SELECT id FROM companies WHERE slug = %s;", (slug,))
            row = cur.fetchone()
            if row:
                cid = row[0]
                cur.execute("UPDATE companies SET name = %s, industry = %s, website = %s WHERE id = %s;", (name, industry, web, cid))
            else:
                cid = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO companies (id, name, slug, industry, website, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s);",
                    (cid, name, slug, industry, web, utc_now(), utc_now())
                )
            company_ids[name] = cid

        # 4. SEED DIVERSE SYNTHETIC CANDIDATES & EDUCATION HISTORY
        print("[4/7] Seeding candidate profiles and education history...", flush=True)
        users_data = [
            ("aadhya_finance", "aadhya.rao@demo.prepshare.test", "Aadhya Rao", "Finance Analyst @ Apex Capital | CFA L2 Candidate", "student", "IIM Ahmedabad", "MBA - Finance", "Bachelors", 2024),
            ("rohit_mech", "rohit.verma@demo.prepshare.test", "Rohit Verma", "Mechanical GET @ Tata Motors | Thermodynamics Specialist", "student", "COEP Technological University", "Mechanical Engineering", "Bachelors", 2024),
            ("sneha_ai", "sneha.sundaram@demo.prepshare.test", "Sneha Sundaram", "AI/ML Systems Researcher | CUDA Optimization Contributor", "student", "IIT Bombay", "Computer Science & Engineering", "Bachelors", 2024),
            ("vikram_civil", "vikram.joshi@demo.prepshare.test", "Vikram Joshi", "Structural Engineer @ L&T | Concrete Design Specialist", "student", "Anna University", "Civil Engineering", "Bachelors", 2024),
            ("ananya_pm", "ananya.sen@demo.prepshare.test", "Ananya Sen", "Associate Product Manager | User Metrics & Strategy", "student", "BITS Pilani", "MBA - Marketing & Strategy", "Masters", 2023),
            ("karthik_cloud", "karthik.nair@demo.prepshare.test", "Karthik Nair", "Cloud SRE @ Google Cloud | Kubernetes & Distributed Systems", "student", "Delhi Technological University", "Computer Science & Engineering", "Bachelors", 2024),
            ("meera_biomed", "meera.patel@demo.prepshare.test", "Dr. Meera Patel", "Biomedical Operations Specialist @ Biocon", "student", "St. Xavier's College", "Biotechnology & Biochemical Engineering", "Masters", 2023),
            ("dev_growth", "devansh.gupta@demo.prepshare.test", "Devansh Gupta", "Growth Marketing Lead @ Razorpay | Performance Analytics", "student", "Symbiosis International University", "MBA - Marketing & Strategy", "Masters", 2023),
            ("tanvi_design", "tanvi.mehta@demo.prepshare.test", "Tanvi Mehta", "Product Designer @ CRED | Design Systems Specialist", "student", "National Institute of Design (NID)", "Master of Design (M.Des - Interaction Design)", "Masters", 2023),
            ("rahul_supply", "rahul.menon@demo.prepshare.test", "Rahul Menon", "Supply Chain Analyst @ Amazon Operations | Inventory Optimization", "student", "BITS Pilani", "Supply Chain & Operations Management", "Masters", 2023),
            ("aarav_nirma", "aarav.shah@demo.prepshare.test", "Aarav Shah", "Mechanical Engineer @ Northstar Manufacturing | CAD Specialist", "student", "Nirma University", "Mechanical Engineering", "Bachelors", 2024),
            ("priya_finance", "priya.mehta@demo.prepshare.test", "Priya Mehta", "Financial Analyst @ Meridian Capital | Valuation Lead", "student", "St. Xavier's College", "B.Com / Finance & Accounting", "Bachelors", 2024),
            ("aditya_civil", "aditya.sharma@demo.prepshare.test", "Aditya Sharma", "Site Engineer @ GreenGrid Infrastructure", "student", "Nirma University", "Civil Engineering", "Bachelors", 2024),
            ("neha_ece", "neha.kulkarni@demo.prepshare.test", "Neha Kulkarni", "Hardware Design Engineer @ Qualcomm | VLSI Specialist", "student", "IIT Delhi", "Electronics & Communication Engineering (ECE)", "Bachelors", 2024),
            ("dr_arjun_health", "arjun.desai@demo.prepshare.test", "Dr. Arjun Desai", "Healthcare Operations Lead @ Apollo Systems", "student", "AIIMS New Delhi", "Healthcare & Hospital Management", "Masters", 2023),
        ]

        user_ids = {}
        education_ids = {}
        default_pwd_hash = "$2b$12$JUbdtqzl6FtF9hxBoYJtL.WIogUPW3QEdHDTZFhKo3DUpNBSgiJ6O"

        for uname, uemail, ufullname, ubio, urole, uinst_name, ucourse, udeg_level, ugrad_year in users_data:
            cur.execute("SELECT id FROM users WHERE username = %s;", (uname,))
            urow = cur.fetchone()
            if urow:
                uid = urow[0]
                cur.execute("UPDATE users SET full_name = %s, bio = %s, contribution_score = 120 WHERE id = %s;", (ufullname, ubio, uid))
            else:
                uid = str(uuid.uuid4())
                cur.execute(
                    """INSERT INTO users (id, email, username, password_hash, full_name, bio, role, contribution_score, follower_count, following_count, is_active, is_email_verified, token_version, created_at, updated_at) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, 120, 0, 0, TRUE, TRUE, 1, %s, %s);""",
                    (uid, uemail, uname, default_pwd_hash, ufullname, ubio, urole, utc_now(), utc_now())
                )
            user_ids[uname] = uid

            inst_id = institution_ids[uinst_name]
            cur.execute("SELECT id FROM education_history WHERE user_id = %s AND course = %s;", (uid, ucourse))
            erow = cur.fetchone()
            if erow:
                eid = erow[0]
            else:
                eid = str(uuid.uuid4())
                cur.execute(
                    """INSERT INTO education_history (id, user_id, degree_level, institution_id, course, branch, education_type, start_year, end_year, is_current, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, 'full_time', %s, %s, FALSE, %s, %s);""",
                    (eid, uid, udeg_level, inst_id, ucourse, ucourse, ugrad_year - 4, ugrad_year, utc_now(), utc_now())
                )
            education_ids[uname] = eid

        # 5. SEED 27 HIGH-QUALITY DIVERSE EXPERIENCES ACROSS INDUSTRIES
        print("[5/7] Seeding 27 industry-diverse interview & hackathon experiences with flexible rounds...", flush=True)

        posts_master = [
            {
                "title": "Northstar Manufacturing Graduate Engineer Trainee Selection Loop",
                "slug": "northstar-manufacturing-get-mechanical-nirma",
                "category": "off_campus_placement",
                "author": "aarav_nirma",
                "company": "Northstar Manufacturing",
                "role": "Graduate Engineer Trainee",
                "location": "Ahmedabad, Gujarat",
                "mode": "onsite",
                "offer": True,
                "package": 850000,
                "currency": "INR",
                "narrative": "Detailed 4-round off-campus mechanical engineering evaluation for Nirma University graduates. Comprehensive assessments on CAD 3D modeling, GD&T tolerance stacking, and production shop-floor logistics.",
                "tips": "Practice rapid parametric part creation in SolidWorks and revise CNC toolpath kinematics.",
                "rounds": [
                    {
                        "name": "Written Technical Assessment",
                        "tags": "Mechanical, Technical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("Explain how shear stress distribution varies across thin-walled structural members under torsion.", "medium"),
                            ("Calculate the minimum safety factor for an AISI 4140 steel axle under fluctuating reversed bending stress.", "hard")
                        ]
                    },
                    {
                        "name": "CAD Design Assessment",
                        "tags": "CAD, Design",
                        "duration": 90,
                        "mode": "offline",
                        "questions": [
                            ("Model a high-pressure hydraulic flange with concentric bolt circle and specify total runout tolerances.", "hard"),
                            ("How do you resolve geometric interference between helical gear meshes during dynamic assembly simulation?", "medium")
                        ]
                    },
                    {
                        "name": "Plant Operations Discussion",
                        "tags": "Manufacturing, Practical",
                        "duration": 45,
                        "mode": "offline",
                        "questions": [
                            ("Walk through the quality inspection procedure for hot-forged connecting rods detecting internal voids.", "medium")
                        ]
                    },
                    {
                        "name": "HR Discussion",
                        "tags": "Behavioral",
                        "duration": 25,
                        "mode": "offline",
                        "questions": [
                            ("Describe how you resolve conflicting deadlines between production scheduling and tooling maintenance.", "easy")
                        ]
                    }
                ]
            },
            {
                "title": "Meridian Capital Financial Analyst Campus Selection",
                "slug": "meridian-capital-financial-analyst-campus",
                "category": "campus_placement",
                "author": "priya_finance",
                "company": "Meridian Capital",
                "role": "Financial Analyst",
                "location": "Mumbai, Maharashtra",
                "mode": "onsite",
                "offer": True,
                "package": 1400000,
                "currency": "INR",
                "narrative": "Comprehensive 4-round financial analysis and valuation loop. Tested 3-statement linking, Discounted Cash Flow (DCF) terminal value calculation, and debt covenant stress testing.",
                "tips": "Know your accounting mechanics: flow of depreciation, prepaid expenses, and inventory write-downs across P&L, BS, and Cash Flow.",
                "rounds": [
                    {
                        "name": "Numerical Assessment",
                        "tags": "Finance, Numerical",
                        "duration": 45,
                        "mode": "online",
                        "questions": [
                            ("Calculate DuPont Return on Equity given Net Margin 14%, Asset Turnover 1.8x, and Leverage Ratio 2.1x.", "medium"),
                            ("Determine the Weighted Average Cost of Capital (WACC) with 60% equity at 12% Cost of Equity and 40% debt at 8% pre-tax yield (tax rate 25%).", "medium")
                        ]
                    },
                    {
                        "name": "Financial Case Study",
                        "tags": "Valuation, Case Study",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("Evaluate an acquisition target: construct a 5-year unlevered DCF model and perform sensitivity analysis on perpetual growth rate vs exit EBITDA multiple.", "hard")
                        ]
                    },
                    {
                        "name": "Analyst Discussion",
                        "tags": "Finance, Technical",
                        "duration": 45,
                        "mode": "offline",
                        "questions": [
                            ("Why does working capital expansion represent a cash outflow on the Statement of Cash Flows?", "medium")
                        ]
                    },
                    {
                        "name": "HR Discussion",
                        "tags": "Behavioral",
                        "duration": 30,
                        "mode": "offline",
                        "questions": [
                            ("How do you ensure 100% mathematical precision under tight deal turnaround timelines?", "easy")
                        ]
                    }
                ]
            },
            {
                "title": "GreenGrid Infrastructure Site Engineer Off-Campus Loop",
                "slug": "greengrid-infrastructure-site-engineer-civil",
                "category": "off_campus_placement",
                "author": "aditya_civil",
                "company": "GreenGrid Infrastructure",
                "role": "Site Engineer",
                "location": "Ahmedabad, Gujarat",
                "mode": "onsite",
                "offer": True,
                "package": 780000,
                "currency": "INR",
                "narrative": "4-round civil and structural engineering hiring loop. In-depth questions on reinforced concrete design (IS 456), foundation soil settlement, and project estimation.",
                "tips": "Be thorough with continuous beam bending moment diagrams and bar bending schedules (BBS).",
                "rounds": [
                    {
                        "name": "Technical Written Test",
                        "tags": "Civil, Technical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("Derive the ultimate moment of resistance for a singly reinforced rectangular concrete beam per IS 456.", "medium"),
                            ("Explain Terzaghi's bearing capacity equation for strip footings on cohesive soils.", "hard")
                        ]
                    },
                    {
                        "name": "Structural Problem Solving",
                        "tags": "Structural, Design",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How do you design shear reinforcement for high-shear zones in transfer girders?", "hard")
                        ]
                    },
                    {
                        "name": "Site Assessment",
                        "tags": "Construction, Practical",
                        "duration": 90,
                        "mode": "offline",
                        "questions": [
                            ("Diagnose causes of honeycombing in heavily reinforced concrete columns and propose repair grouting specifications.", "medium")
                        ]
                    },
                    {
                        "name": "Project Manager Discussion",
                        "tags": "Behavioral, Management",
                        "duration": 30,
                        "mode": "offline",
                        "questions": [
                            ("How do you coordinate contractor material deliveries while enforcing strict site safety compliance?", "easy")
                        ]
                    }
                ]
            },
            {
                "title": "TCS Engineering Services Mechanical Design Placement",
                "slug": "tcs-mechanical-design-placement-loop",
                "category": "campus_placement",
                "author": "rahul_supply",
                "company": "Tata Consultancy Services (TCS)",
                "role": "Mechanical Design Engineer",
                "location": "Pune, Maharashtra",
                "mode": "onsite",
                "offer": True,
                "package": 900000,
                "currency": "INR",
                "narrative": "Technical campus selection loop for TCS Engineering & Industrial Services. Focused on CAD modeling, Finite Element Analysis (FEA) boundary conditions, and automotive chassis stress validation.",
                "tips": "Review von Mises stress failure criteria and tetrahedral vs hexahedral mesh convergence.",
                "rounds": [
                    {
                        "name": "CAD Modeling & FEA Analysis",
                        "tags": "CAD, Mechanical, FEA",
                        "duration": 75,
                        "mode": "offline",
                        "questions": [
                            ("Explain the difference between linear static and non-linear dynamic FEA for crash impact simulation.", "hard"),
                            ("How do you eliminate stress singularities near sharp geometric corners in numerical mesh refinement?", "medium")
                        ]
                    },
                    {
                        "name": "Manufacturing Quality Controls",
                        "tags": "Manufacturing, Quality",
                        "duration": 45,
                        "mode": "offline",
                        "questions": [
                            ("Explain Six Sigma Cp and Cpk capability indices for precision CNC machining tolerances.", "medium")
                        ]
                    },
                    {
                        "name": "Technical Manager Discussion",
                        "tags": "Behavioral",
                        "duration": 30,
                        "mode": "offline",
                        "questions": [
                            ("Describe an engineering project where you optimized material weight without compromising load capacity.", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "Qualcomm Hardware Design Engineer Campus Selection",
                "slug": "qualcomm-ece-hardware-design-campus",
                "category": "campus_placement",
                "author": "neha_ece",
                "company": "Qualcomm Technologies",
                "role": "Hardware Design Engineer",
                "location": "Bengaluru, Karnataka",
                "mode": "onsite",
                "offer": True,
                "package": 2600000,
                "currency": "INR",
                "narrative": "3-round hardware and digital circuit design interview for ECE graduates. Evaluated Verilog RTL design, setup/hold time timing closure, and high-speed PCIe signal integrity.",
                "tips": "Practice drawing timing diagrams for synchronous FIFO pointers and metastability synchronizers.",
                "rounds": [
                    {
                        "name": "Digital Logic & Verilog RTL",
                        "tags": "ECE, VLSI, Digital Logic",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Write a synthesis-friendly Verilog module for an asynchronous FIFO with Gray code read/write pointer synchronization.", "hard"),
                            ("Explain how clock skew impacts setup time and hold time margins in static timing analysis (STA).", "hard")
                        ]
                    },
                    {
                        "name": "Signal Integrity & Timing Closure",
                        "tags": "ECE, Hardware, Signal Integrity",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How do you minimize differential impedance discontinuities and crosstalk in multi-gigabit PCB trace routing?", "hard")
                        ]
                    },
                    {
                        "name": "Managerial & System Fit",
                        "tags": "Behavioral",
                        "duration": 30,
                        "mode": "offline",
                        "questions": [
                            ("Discuss a challenging hardware debugging session where lab oscilloscope measurements diverged from simulation models.", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "Razorpay Growth Marketing Specialist Loop",
                "slug": "razorpay-growth-marketing-specialist-loop",
                "category": "off_campus_placement",
                "author": "dev_growth",
                "company": "Razorpay",
                "role": "Growth Marketing Specialist",
                "location": "Bengaluru, Karnataka",
                "mode": "hybrid",
                "offer": True,
                "package": 1650000,
                "currency": "INR",
                "narrative": "Focused on B2B SaaS paid acquisition funnel, merchant conversion rate optimization (CRO), multi-touch attribution, and cohort LTV/CAC modeling.",
                "tips": "Bring clear quantitative examples of scaling performance campaigns while keeping payback period under 6 months.",
                "rounds": [
                    {
                        "name": "Paid Acquisition & CRO",
                        "tags": "Marketing, Analytics, Growth",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("How would you structure a multi-touch attribution model for self-serve payment gateway signups?", "medium"),
                            ("Calculate Blended CAC vs Paid CAC when organic referrals account for 42% of incoming merchant onboarding volume.", "medium")
                        ]
                    },
                    {
                        "name": "VP Growth Strategy Presentation",
                        "tags": "Marketing, Strategy, Presentation",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("Present a 90-day growth roadmap to increase SMB merchant checkout onboarding completion from 62% to 75%.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Apollo Healthcare Systems Operations Placement",
                "slug": "apollo-healthcare-operations-lead-placement",
                "category": "off_campus_placement",
                "author": "dr_arjun_health",
                "company": "Apollo Healthcare Systems",
                "role": "Healthcare Operations Lead",
                "location": "Hyderabad, Telangana",
                "mode": "onsite",
                "offer": True,
                "package": 1900000,
                "currency": "INR",
                "narrative": "3-round hospital operational leadership loop for healthcare management graduates. Evaluated emergency room patient triage throughput, supply chain logistics, and NABH clinical audit compliance.",
                "tips": "Ground every operational recommendation in patient safety metrics and bed occupancy turnaround times.",
                "rounds": [
                    {
                        "name": "Patient Workflow Optimization",
                        "tags": "Healthcare, Operations, Workflow",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How do you redesign ER triage routing to reduce average door-to-doctor time from 48 minutes to under 20 minutes?", "hard"),
                            ("What queuing theory model best optimizes ICU bed allocation during seasonal surge epidemics?", "medium")
                        ]
                    },
                    {
                        "name": "Hospital Telemetry & Inventory",
                        "tags": "Healthcare, Logistics, Compliance",
                        "duration": 45,
                        "mode": "offline",
                        "questions": [
                            ("How do you audit and automate cold-chain pharmaceutical tracking preventing temperature deviation spoilage?", "medium")
                        ]
                    },
                    {
                        "name": "Medical Director Interview",
                        "tags": "Behavioral, Leadership",
                        "duration": 30,
                        "mode": "offline",
                        "questions": [
                            ("Describe your protocol for resolving high-stress operational bottlenecks between surgical suites and nursing stations.", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "Tata Motors GET Mechanical Engineering Campus Placement Loop",
                "slug": "tata-motors-get-mechanical-campus-loop",
                "category": "campus_placement",
                "author": "rohit_mech",
                "company": "Tata Motors",
                "role": "Graduate Engineer Trainee (GET - Powertrain)",
                "location": "Pune, Maharashtra",
                "mode": "onsite",
                "offer": True,
                "package": 950000,
                "currency": "INR",
                "narrative": "Rigorous 2-round campus selection for mechanical engineering graduates. The process thoroughly tested fundamentals of internal combustion, electric drive motors, and GD&T tolerance analysis.",
                "tips": "Revise Shigley's Mechanical Engineering Design and thermodynamics cycle efficiency calculations thoroughly.",
                "rounds": [
                    {
                        "name": "Technical Assessment & Thermodynamics",
                        "tags": "Mechanical, Technical, Thermodynamics",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Explain the difference between true stress and engineering stress during plastic deformation.", "medium"),
                            ("Calculate the thermal efficiency of an ideal Otto cycle given compression ratio r = 9.5 and gamma = 1.4.", "hard")
                        ]
                    },
                    {
                        "name": "Powertrain Dynamics & EV Architecture",
                        "tags": "Automotive, Powertrain, CAD",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How do you specify circular runout vs total runout on a rotating drive shaft drawing?", "medium"),
                            ("Explain regenerative braking mechanics in EV powertrain architecture and how torque vectoring works.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Apex Capital Investment Banking Analyst Campus Superday",
                "slug": "apex-capital-ib-analyst-campus-superday",
                "category": "campus_placement",
                "author": "aadhya_finance",
                "company": "Apex Capital Partners",
                "role": "Investment Banking Analyst (M&A)",
                "location": "Mumbai, Maharashtra",
                "mode": "onsite",
                "offer": True,
                "package": 1800000,
                "currency": "INR",
                "narrative": "Rigorous 3-round valuation and financial modeling superday. Strong emphasis on 3-statement linking, DCF sensitivity tables, and working capital dynamics.",
                "tips": "Practice walking through financial statements in your sleep. Understand how a $10 increase in depreciation flows through Income Statement, Cash Flow, and Balance Sheet.",
                "rounds": [
                    {
                        "name": "3-Statement & DCF Modeling",
                        "tags": "Finance, Valuation, Modeling",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Walk me through the flow across all 3 statements if depreciation increases by $20 at a 25% tax rate.", "medium"),
                            ("Why would Enterprise Value remain unchanged if a company issues $50M in debt to hold as cash?", "medium")
                        ]
                    },
                    {
                        "name": "LBO & Transaction Structuring",
                        "tags": "Finance, LBO, Technical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How do you calculate Unlevered Free Cash Flow (FCFF) from EBITDA and adjust for changes in Net Working Capital?", "hard"),
                            ("What are the primary drivers of IRR in a sponsor-backed LBO transaction?", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Larsen & Toubro Structural & Site Engineering Selection",
                "slug": "larsen-toubro-structural-site-selection",
                "category": "campus_placement",
                "author": "vikram_civil",
                "company": "Larsen & Toubro",
                "role": "Assistant Structural Engineer",
                "location": "Chennai, Tamil Nadu",
                "mode": "onsite",
                "offer": True,
                "package": 820000,
                "currency": "INR",
                "narrative": "Detailed technical interview evaluating RCC design (IS 456), soil mechanics, and seismic load distribution for commercial high-rises.",
                "tips": "Be crystal clear with shear force diagrams, bending moments in continuous beams, and slump test quality controls.",
                "rounds": [
                    {
                        "name": "RCC Design & IS 456 Concepts",
                        "tags": "Civil, Structural, Concrete",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("Draw the shear stress distribution diagram for an I-section beam under vertical transverse shear.", "medium"),
                            ("What is the difference between working stress method (WSM) and limit state method (LSM) per IS 456?", "medium")
                        ]
                    },
                    {
                        "name": "Foundation Engineering & Soil Mechanics",
                        "tags": "Civil, Geotechnical, Practical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How do you determine whether to use pile foundations vs raft foundations in clayey soil with high water table?", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Google Cloud Campus Site Reliability Engineering Interview",
                "slug": "google-cloud-campus-sre-interview",
                "category": "campus_placement",
                "author": "karthik_cloud",
                "company": "Google Cloud",
                "role": "Associate Site Reliability Engineer (SRE)",
                "location": "Bengaluru, Karnataka",
                "mode": "remote",
                "offer": True,
                "package": 2800000,
                "currency": "INR",
                "narrative": "Three rounds focusing on Linux kernel internals, TCP/IP networking stack, distributed system debugging, and Python systems automation.",
                "tips": "Read the Google SRE Book and practice live triage with strace, tcpdump, and gdb.",
                "rounds": [
                    {
                        "name": "Linux Kernel & Networking Systems",
                        "tags": "Linux, Systems, Networking",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("What happens at the kernel level during an epoll_wait syscall compared to select/poll?", "hard"),
                            ("Write a script to analyze Nginx access logs and alert if the 99th percentile latency exceeds 200ms.", "medium")
                        ]
                    },
                    {
                        "name": "Distributed Systems Debugging",
                        "tags": "Kubernetes, Cloud, Debugging",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Debug a scenario where high CPU utilization occurs only on specific Kubernetes pods under gRPC load balancing.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "NVIDIA Deep Learning Systems & CUDA Performance Engineer",
                "slug": "nvidia-deep-learning-systems-engineer",
                "category": "off_campus_placement",
                "author": "sneha_ai",
                "company": "NVIDIA",
                "role": "Deep Learning Systems Engineer",
                "location": "Bengaluru, Karnataka",
                "mode": "remote",
                "offer": True,
                "package": 3400000,
                "currency": "INR",
                "narrative": "Technical process diving deep into GPU microarchitecture, CUDA kernel memory coalescence, and FlashAttention kernel optimization.",
                "tips": "Understand shared memory bank conflicts and tensor core matrix multiplication tile sizes.",
                "rounds": [
                    {
                        "name": "GPU Microarchitecture & CUDA Kernels",
                        "tags": "AI, CUDA, GPU, Systems",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Explain how warp divergence occurs on an NVIDIA Ampere streaming multiprocessor and how to restructure branching.", "hard"),
                            ("Optimize a 2D matrix transpose CUDA kernel to prevent shared memory bank conflicts.", "hard")
                        ]
                    },
                    {
                        "name": "Attention Kernels & Distributed Inference",
                        "tags": "Deep Learning, PyTorch, CUDA",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("How does FlashAttention avoid high-bandwidth memory (HBM) IO bottlenecks during self-attention computation?", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "CRED Senior Product Designer Off-Campus Selection",
                "slug": "cred-senior-product-designer-offcampus",
                "category": "off_campus_placement",
                "author": "tanvi_design",
                "company": "CRED",
                "role": "Product Designer (Design Systems)",
                "location": "Bengaluru, Karnataka",
                "mode": "onsite",
                "offer": True,
                "package": 2400000,
                "currency": "INR",
                "narrative": "Three rounds reviewing design craft, token architecture, Figma variables, accessibility standards, and haptic feedback design.",
                "tips": "Focus heavily on typography hierarchies, high-contrast dark mode legibility, and micro-interaction rationale.",
                "rounds": [
                    {
                        "name": "Design Systems & Token Architecture",
                        "tags": "Design, Figma, UI/UX",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Walk through your design decision framework for choosing custom easing curves vs standard material easing.", "medium")
                        ]
                    },
                    {
                        "name": "Live App Teardown & Design Challenge",
                        "tags": "Design, Product, Prototype",
                        "duration": 90,
                        "mode": "offline",
                        "questions": [
                            ("Redesign a multi-tiered rewards redemption drawer maximizing visual hierarchy and reducing thumb-reach friction.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Amazon Operations - Logistics & Supply Chain Manager",
                "slug": "amazon-operations-supply-chain-manager",
                "category": "off_campus_placement",
                "author": "rahul_supply",
                "company": "Amazon Operations",
                "role": "Area Operations Manager",
                "location": "Hyderabad, Telangana",
                "mode": "onsite",
                "offer": True,
                "package": 2100000,
                "currency": "INR",
                "narrative": "Heavy emphasis on Amazon Leadership Principles (Customer Obsession, Bias for Action, Dive Deep) and warehouse throughput bottleneck elimination.",
                "tips": "Prepare all behavioral answers using the STAR method with quantified metric impacts.",
                "rounds": [
                    {
                        "name": "Fulfillment Center Bottleneck Analysis",
                        "tags": "Supply Chain, Operations, Logistics",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("If packaging throughput drops by 18% during peak festival season due to SKU mismatches, how do you diagnose root cause in 2 hours?", "hard")
                        ]
                    },
                    {
                        "name": "Leadership Principles Behavioral Loop",
                        "tags": "Behavioral, Leadership",
                        "duration": 45,
                        "mode": "offline",
                        "questions": [
                            ("Tell me about a time you had to make a high-stakes operational decision without complete telemetry data.", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "Sustainable Campus Challenge - Nirma University Green Sprint",
                "slug": "sustainable-campus-challenge-nirma",
                "category": "campus_hackathon",
                "author": "aditya_civil",
                "company": "GreenGrid Infrastructure",
                "role": "Sustainability Lead",
                "location": "Ahmedabad, Gujarat",
                "mode": "onsite",
                "offer": False,
                "package": None,
                "currency": None,
                "narrative": "Won 1st prize in the 36-hour campus hackathon at Nirma University. Built an IoT-connected smart energy telemetry grid that detects HVAC heating/cooling leakages across campus academic blocks.",
                "tips": "Ensure your live demonstration hardware operates reliably without cloud dependency during judging.",
                "rounds": [
                    {
                        "name": "Problem Statement & Ideation",
                        "tags": "Sustainability, Ideation, Hackathon",
                        "duration": 45,
                        "mode": "offline",
                        "questions": [
                            ("How does your sensor network calculate baseline energy consumption across diverse classroom occupancy profiles?", "medium")
                        ]
                    },
                    {
                        "name": "Prototype Demonstration & Jury Q&A",
                        "tags": "Prototype, IoT, Presentation",
                        "duration": 30,
                        "mode": "offline",
                        "questions": [
                            ("Demonstrate real-time MQTT sensor data ingestion and automated relay shutoff during peak demand threshold breach.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Global Cloud Resilience Hackathon - Multi-Region Chaos Engineering",
                "slug": "global-cloud-resilience-hackathon-chaos",
                "category": "off_campus_hackathon",
                "author": "karthik_cloud",
                "company": "Google Cloud",
                "role": "Chaos Engineering Architect",
                "location": "Global Virtual",
                "mode": "remote",
                "offer": False,
                "package": None,
                "currency": None,
                "narrative": "Constructed an automated chaos orchestrator that injects synthetic packet loss and BGP blackholing to test Kubernetes control plane split-brain recovery.",
                "tips": "Ensure telemetry dashboards display mean-time-to-recovery (MTTR) with millisecond fidelity.",
                "rounds": [
                    {
                        "name": "Architecture Review & Chaos Injection",
                        "tags": "Cloud, Chaos Engineering, Kubernetes",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("How does the Raft consensus protocol prevent split-brain leader elections during a 50% network partition?", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Graduate Engineer Trainee Interview Experience",
                "slug": "graduate-engineer-trainee-interview-experience-mechanical",
                "category": "off_campus_placement",
                "author": "anonymous",
                "company": "Northstar Manufacturing",
                "role": "Graduate Engineer Trainee",
                "location": "Ahmedabad, Gujarat",
                "mode": "onsite",
                "offer": True,
                "package": 800000,
                "currency": "INR",
                "narrative": "Thorough evaluation of mechanical design principles, strength of materials, and manufacturing process selection. Practical questions focused on sheet metal forming and injection molding tooling.",
                "tips": "Be ready to sketch shear stress distributions and explain draft angles for cast components on the whiteboard.",
                "rounds": [
                    {
                        "name": "Technical Design Round",
                        "tags": "Mechanical, CAD, Technical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("Explain how cooling rate affects grain boundary formation in aluminum die casting.", "medium"),
                            ("How do you calculate minimum bend radius for high-strength steel sheet metal stamping?", "medium")
                        ]
                    },
                    {
                        "name": "Manufacturing Operations",
                        "tags": "Manufacturing, Operations",
                        "duration": 45,
                        "mode": "offline",
                        "questions": [
                            ("Walk through your troubleshooting steps if high tool chatter is detected during CNC milling.", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "Financial Analyst Selection Process",
                "slug": "financial-analyst-selection-process-meridian",
                "category": "campus_placement",
                "author": "anonymous",
                "company": "Meridian Capital",
                "role": "Financial Analyst",
                "location": "Mumbai, Maharashtra",
                "mode": "onsite",
                "offer": True,
                "package": 1350000,
                "currency": "INR",
                "narrative": "Three-stage evaluation focusing on corporate finance fundamentals, working capital optimization, and financial statement ratio analysis.",
                "tips": "Practice reconciling cash flow statements from balance sheet delta changes.",
                "rounds": [
                    {
                        "name": "Financial Statement Analysis",
                        "tags": "Finance, Accounting, Valuation",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How does capitalizing R&D expenditures instead of expensing them impact EBITDA, Operating Cash Flow, and ROIC?", "hard"),
                            ("Explain the differences between Quick Ratio and Current Ratio when evaluating liquidity during inventory buildup.", "medium")
                        ]
                    },
                    {
                        "name": "Managerial Fit",
                        "tags": "Behavioral",
                        "duration": 30,
                        "mode": "offline",
                        "questions": [
                            ("How do you validate source financial data integrity when conflicting filings are identified in vendor audits?", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "Google L4 Systems Engineering Assessment (Autumn 2026)",
                "slug": "google-l4-systems-engineering-assessment-autumn-2026-21fabb",
                "category": "campus_placement",
                "author": "anonymous",
                "company": "Google Cloud",
                "role": "Systems Software Engineer",
                "location": None,
                "mode": None,
                "offer": True,
                "package": 3400000,
                "currency": "INR",
                "narrative": "High technical rigor focused on consistency models, consensus, and network partitions.",
                "tips": "Study Designing Data-Intensive Applications (DDIA) chapters 7, 8, and 9 thoroughly.",
                "rounds": [
                    {
                        "name": "Round 1: Distributed Storage & Consensus",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Implement Raft consensus leader election and log compaction algorithms in Go/C++.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Razorpay Growth & Performance Marketing Specialist Loop",
                "slug": "razorpay-growth-performance-marketing-loop",
                "category": "off_campus_placement",
                "author": "dev_growth",
                "company": "Razorpay",
                "role": "Growth Marketing Specialist",
                "location": "Bengaluru, Karnataka",
                "mode": "hybrid",
                "offer": True,
                "package": 1650000,
                "currency": "INR",
                "narrative": "Focused on B2B SaaS paid funnel acquisition, merchant conversion rate optimization (CRO), and cohort retention models.",
                "tips": "Bring concrete examples of scaling Google/LinkedIn Ad spend while improving Payback Period under 6 months.",
                "rounds": [
                    {
                        "name": "Technical Round 1",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("How would you structure a multi-touch attribution model for self-serve payment gateway signups?", "medium"),
                            ("Calculate Blended CAC vs Paid CAC if organic referrals represent 40% of incoming merchant volume.", "medium")
                        ]
                    },
                    {
                        "name": "Technical Round 2",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Present a 90-day growth roadmap to increase SMB merchant checkout onboarding completion from 62% to 75%.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Smart India Internal Campus Hackathon - AI Pathology Diagnostics",
                "slug": "smart-india-campus-hackathon-ai-diagnostics",
                "category": "campus_hackathon",
                "author": "sneha_ai",
                "company": "Biocon Biologics",
                "role": "Hackathon Team Lead (Computer Vision)",
                "location": "Bengaluru, Karnataka",
                "mode": "onsite",
                "offer": False,
                "package": None,
                "currency": None,
                "narrative": "Won 1st prize in the 24-hour campus hackathon by training a lightweight Vision Transformer to detect microscopic cellular anomalies on edge devices.",
                "tips": "Optimize your model quantization early. A model that cannot run in real time on judge hardware will lose points.",
                "rounds": [
                    {
                        "name": "Technical Round 1",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How do you handle severe class imbalance in rare clinical pathology datasets without overfitting?", "medium")
                        ]
                    },
                    {
                        "name": "Technical Round 2",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("Demonstrate sub-50ms inference latency on Raspberry Pi 4 using INT8 TensorRT quantization.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "National Green Infrastructure & Sustainable Construction Sprint",
                "slug": "national-green-infrastructure-sprint",
                "category": "campus_hackathon",
                "author": "vikram_civil",
                "company": "Larsen & Toubro",
                "role": "Green Building Lead",
                "location": "Chennai, Tamil Nadu",
                "mode": "onsite",
                "offer": False,
                "package": None,
                "currency": None,
                "narrative": "Developed a parametric BIM plugin that calculates embodied carbon footprint during structural modeling and suggests fly-ash concrete substitutions.",
                "tips": "Have your Life Cycle Assessment (LCA) environmental impact equations ready before hacking begins.",
                "rounds": [
                    {
                        "name": "Technical Round 1",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("How does replacing 30% Portland cement with ground granulated blast-furnace slag (GGBS) impact 28-day compressive strength?", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "FinTech Campus Innovation Sprint - Algorithmic Escrow",
                "slug": "fintech-campus-innovation-sprint-escrow",
                "category": "campus_hackathon",
                "author": "aadhya_finance",
                "company": "Apex Capital Partners",
                "role": "FinTech Product Architect",
                "location": "Mumbai, Maharashtra",
                "mode": "remote",
                "offer": False,
                "package": None,
                "currency": None,
                "narrative": "Built an automated cross-border trade settlement system with zero settlement slippage and real-time FX hedging.",
                "tips": "Ensure multi-currency decimal precision handling handles rounding edge cases without penny discrepancy.",
                "rounds": [
                    {
                        "name": "Technical Round 1",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("How do you guarantee atomic transaction settlement across disconnected banking APIs during gateway downtime?", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Autonomous Robotics Sprint - Warehouse AGV Pathfinding",
                "slug": "autonomous-robotics-sprint-agv-pathfinding",
                "category": "campus_hackathon",
                "author": "rohit_mech",
                "company": "Tata Motors",
                "role": "Robotics & Kinematics Lead",
                "location": "Pune, Maharashtra",
                "mode": "onsite",
                "offer": False,
                "package": None,
                "currency": None,
                "narrative": "Designed and fabricated a differential-drive automated guided vehicle (AGV) capable of navigating warehouse dynamic obstacles.",
                "tips": "Tune your PID motor controllers on real floor friction before the final evaluation track.",
                "rounds": [
                    {
                        "name": "Technical Round 1",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "offline",
                        "questions": [
                            ("Derive the non-holonomic motion equations for a differential drive robot with wheel slip compensation.", "hard")
                        ]
                    }
                ]
            },
            {
                "title": "Biotech Genomics Challenge - High-Throughput RNA-Seq Pipeline",
                "slug": "biotech-genomics-challenge-rna-seq",
                "category": "off_campus_hackathon",
                "author": "meera_biomed",
                "company": "Biocon Biologics",
                "role": "Bioinformatics Pipeline Lead",
                "location": "Bengaluru, Karnataka",
                "mode": "remote",
                "offer": False,
                "package": None,
                "currency": None,
                "narrative": "Built a serverless Nextflow pipeline processing 50GB RNA-Seq FASTQ datasets for oncology biomarker identification under 12 minutes.",
                "tips": "Parallelize alignment reads using indexed genome indexes stored in RAM disks.",
                "rounds": [
                    {
                        "name": "Technical Round 1",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("Explain the difference between STAR aligner and Bowtie2 for spliced RNA transcript mapping.", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "Product Teardown League - Consumer Grocery Micro-Fulfillment",
                "slug": "product-teardown-micro-fulfillment",
                "category": "off_campus_hackathon",
                "author": "ananya_pm",
                "company": "Swiggy",
                "role": "Product Strategist",
                "location": "Bengaluru, Karnataka",
                "mode": "remote",
                "offer": False,
                "package": None,
                "currency": None,
                "narrative": "Engineered a product teardown predicting 10-minute dark store stocking bottlenecks and proposed a dynamic order batching algorithm.",
                "tips": "Ground every feature recommendation in unit economics and rider turnaround time.",
                "rounds": [
                    {
                        "name": "Technical Round 1",
                        "tags": "Technical",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("How do you prioritize dark store picker ergonomics vs batch routing efficiency during peak order surges?", "medium")
                        ]
                    }
                ]
            },
            {
                "title": "Confidential Staff Security Architect Evaluation",
                "slug": "confidential-staff-security-architect-evaluation",
                "category": "off_campus_placement",
                "author": "anonymous",
                "company": "Google Cloud",
                "role": "Staff Security Engineer (Zero-Trust)",
                "location": "Bengaluru, Karnataka",
                "mode": "remote",
                "offer": True,
                "package": 4200000,
                "currency": "INR",
                "narrative": "Comprehensive evaluation of cybersecurity zero-trust architecture, mutual TLS certificate management, and hardware security module (HSM) attestation.",
                "tips": "Deeply understand SPIFFE/SPIRE workload identities and OAuth 2.0 token exchange specifications.",
                "rounds": [
                    {
                        "name": "Technical Round 1",
                        "tags": "Technical, Cybersecurity, Zero-Trust, Cloud Security",
                        "duration": 60,
                        "mode": "online",
                        "questions": [
                            ("How do you architect microservice mutual TLS with automated short-lived certificate rotation without connection drops?", "hard"),
                            ("Explain how to protect against pass-the-hash attacks in hybrid cloud Active Directory environments.", "hard")
                        ]
                    }
                ]
            }
        ]

        for p in posts_master:
            is_anon = (p["author"] == "anonymous")
            author_id = user_ids["aarav_nirma"] if is_anon else user_ids[p["author"]]
            comp_id = company_ids[p["company"]]
            edu_id = education_ids.get(p["author"]) if not is_anon else education_ids["aarav_nirma"]

            cur.execute("SELECT id FROM interview_posts WHERE slug = %s;", (p["slug"],))
            existing = cur.fetchone()
            if existing:
                post_id = existing[0]
                cur.execute(
                    """UPDATE interview_posts 
                       SET title = %s, company_id = %s, education_id = %s, job_role = %s, work_location = %s, 
                           work_mode = %s, is_offer_received = %s, package_amount = %s, currency = %s, 
                           experience_text = %s, tips = %s, is_anonymous = %s, status = 'published', 
                           published_at = %s, updated_at = %s
                       WHERE id = %s;""",
                    (p["title"], comp_id, edu_id, p["role"], p["location"], p["mode"], p["offer"], p["package"], 
                     p["currency"], p["narrative"], p["tips"], is_anon, utc_now() - timedelta(days=2), utc_now(), post_id)
                )
            else:
                post_id = str(uuid.uuid4())
                cur.execute(
                    """INSERT INTO interview_posts 
                       (id, user_id, title, slug, post_category, company_id, education_id, job_role, work_location, work_mode, 
                        is_offer_received, package_amount, currency, experience_text, tips, is_anonymous, status, 
                        view_count, share_count, published_at, created_at, updated_at) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'published', 0, 0, %s, %s, %s);""",
                    (post_id, author_id, p["title"], p["slug"], p["category"], comp_id, edu_id, p["role"], p["location"], 
                     p["mode"], p["offer"], p["package"], p["currency"], p["narrative"], p["tips"], is_anon, 
                     utc_now() - timedelta(days=2), utc_now() - timedelta(days=2), utc_now())
                )

            for r_idx, r in enumerate(p["rounds"]):
                cur.execute("SELECT id FROM interview_rounds WHERE name = %s;", (r["name"],))
                r_row = cur.fetchone()
                if r_row:
                    round_id = r_row[0]
                else:
                    round_id = str(uuid.uuid4())
                    cur.execute(
                        "INSERT INTO interview_rounds (id, name) VALUES (%s, %s);",
                        (round_id, r["name"])
                    )

                cur.execute("SELECT id FROM post_rounds WHERE post_id = %s AND round_id = %s;", (post_id, round_id))
                pr_existing = cur.fetchone()
                if pr_existing:
                    post_round_id = pr_existing[0]
                    cur.execute(
                        "UPDATE post_rounds SET duration_minutes = %s, round_tags = %s, mode = %s WHERE id = %s;",
                        (r.get("duration"), r.get("tags"), r["mode"], post_round_id)
                    )
                else:
                    post_round_id = str(uuid.uuid4())
                    cur.execute(
                        "INSERT INTO post_rounds (id, post_id, round_id, round_number, mode, duration_minutes, round_tags, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);",
                        (post_round_id, post_id, round_id, r_idx + 1, r["mode"], r.get("duration"), r.get("tags"), utc_now())
                    )

                for q_text, q_diff in r["questions"]:
                    cur.execute("SELECT id FROM interview_questions WHERE post_id = %s AND question_text = %s;", (post_id, q_text))
                    if not cur.fetchone():
                        qid = str(uuid.uuid4())
                        easy_c = 1 if q_diff == "easy" else 0
                        med_c = 3 if q_diff == "medium" else 1
                        hard_c = 4 if q_diff == "hard" else 1
                        cur.execute(
                            """INSERT INTO interview_questions 
                               (id, post_id, post_round_id, question_text, easy_count, medium_count, hard_count, is_verified, created_at, updated_at) 
                               VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, %s, %s);""",
                            (qid, post_id, post_round_id, q_text, easy_c, med_c, hard_c, utc_now(), utc_now())
                        )
            conn.commit()
            print(f"  + Seeded Post: '{p['title'][:45]}...'", flush=True)

        print("[6/7] Seeding authentic comments, likes, and bookmarks...", flush=True)
        cur.execute("SELECT id, title FROM interview_posts WHERE slug = 'northstar-manufacturing-get-mechanical-nirma';")
        ns_post = cur.fetchone()
        if ns_post:
            ns_pid = ns_post[0]
            comm_id = str(uuid.uuid4())
            cur.execute(
                """INSERT INTO comments (id, post_id, user_id, comment_text, created_at, updated_at) 
                   VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;""",
                (comm_id, ns_pid, user_ids["rohit_mech"], "Great breakdown of the SolidWorks CAD test! Did they give step-by-step 2D engineering drawings or ask you to model from a physical part?", utc_now() - timedelta(hours=22), utc_now())
            )
            cur.execute(
                """INSERT INTO comments (id, post_id, user_id, comment_text, parent_comment_id, created_at, updated_at) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING;""",
                (str(uuid.uuid4()), ns_pid, user_ids["aarav_nirma"], "They provided a multi-view 2D blueprint with GD&T runout specifications and asked for both the 3D model and mass properties report.", comm_id, utc_now() - timedelta(hours=20), utc_now())
            )

        print("[7/7] Synthetic dataset seeded successfully!")
        print("=" * 70, flush=True)
        return True

    except Exception as e:
        print(f"[-] ERROR DURING SEEDING: {e}", flush=True)
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = run_seed()
    sys.exit(0 if success else 1)
