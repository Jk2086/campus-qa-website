-- CAMPUS-Q&A Seed Data
-- Migration 002: Seed Data

-- 1. Users
INSERT INTO users (id, name, email, student_id, password_hash, role, reputation, subjects, badges, avatar_initials, institution) VALUES
('u1', 'Ananya Iyer', 'ananya.iyer@university.edu', 'CS22B041', '$2a$10$MvZi834yJ1lr/DhoGI3Y.e/pM6lim7D0knBacvm2Gy9IN3corB8vO', 'student', 428, '["Computer Science", "Mathematics"]'::jsonb, '["Curious Mind", "First Answer", "Top Asker"]'::jsonb, 'AI', 'Northfield Institute of Technology'),
('u2', 'Dr. Meera Raghavan', 'meera.raghavan@university.edu', 'FAC-0192', '$2a$10$MvZi834yJ1lr/DhoGI3Y.e/pM6lim7D0knBacvm2Gy9IN3corB8vO', 'faculty', 2140, '["Biology", "Biotechnology"]'::jsonb, '["Verified Faculty", "100 Accepted Answers"]'::jsonb, 'MR', 'Northfield Institute of Technology'),
('u3', 'Rohit Banerjee', 'rohit.banerjee@university.edu', 'EC21B117', '$2a$10$MvZi834yJ1lr/DhoGI3Y.e/pM6lim7D0knBacvm2Gy9IN3corB8vO', 'mentor', 1320, '["Physics", "Mathematics"]'::jsonb, '["Verified Mentor", "Problem Solver"]'::jsonb, 'RB', 'Northfield Institute of Technology'),
('u4', 'Sana Qureshi', 'sana.qureshi@university.edu', 'BT22B008', '$2a$10$MvZi834yJ1lr/DhoGI3Y.e/pM6lim7D0knBacvm2Gy9IN3corB8vO', 'mentor', 980, '["Biotechnology", "Chemistry"]'::jsonb, '["Verified Mentor", "Lab Guru"]'::jsonb, 'SQ', 'Northfield Institute of Technology'),
('u5', 'Kabir Menon', 'kabir.menon@university.edu', 'CS21B093', '$2a$10$MvZi834yJ1lr/DhoGI3Y.e/pM6lim7D0knBacvm2Gy9IN3corB8vO', 'mentor', 1545, '["Computer Science"]'::jsonb, '["Verified Mentor", "Algorithm Ace"]'::jsonb, 'KM', 'Northfield Institute of Technology'),
('u6', 'Priya Nair', 'priya.nair@university.edu', 'PH22B055', '$2a$10$MvZi834yJ1lr/DhoGI3Y.e/pM6lim7D0knBacvm2Gy9IN3corB8vO', 'student', 212, '["Physics"]'::jsonb, '["Helpful Peer"]'::jsonb, 'PN', 'Northfield Institute of Technology'),
('u7', 'Arjun Deshmukh', 'arjun.deshmukh@university.edu', 'CH22B031', '$2a$10$MvZi834yJ1lr/DhoGI3Y.e/pM6lim7D0knBacvm2Gy9IN3corB8vO', 'student', 156, '["Chemistry"]'::jsonb, '["Curious Mind"]'::jsonb, 'AD', 'Northfield Institute of Technology'),
('u8', 'Admin Desk', 'moderation@university.edu', 'ADM-0001', '$2a$10$MvZi834yJ1lr/DhoGI3Y.e/pM6lim7D0knBacvm2Gy9IN3corB8vO', 'admin', 0, '[]'::jsonb, '["Moderator"]'::jsonb, 'AD', 'Northfield Institute of Technology')
ON CONFLICT (id) DO NOTHING;

-- 2. Mentor Profiles
INSERT INTO mentor_profiles (id, user_id, expertise, verified, helpful_answers, bio, response_time, department, year_or_designation, availability, contact_method) VALUES
('m1', 'u2', '["Biology", "Biotechnology"]'::jsonb, TRUE, 214, 'Faculty, Department of Life Sciences. Research in molecular genetics and enzyme kinetics.', 'Usually replies in 3 hours', 'Life Sciences', 'Associate Professor', 'Mon-Fri 2pm-5pm', 'Office Hours / Portal'),
('m2', 'u3', '["Physics", "Mathematics"]'::jsonb, TRUE, 168, 'Final-year student mentor for electrodynamics, thermodynamics and linear algebra tutorials.', 'Usually replies in 5 hours', 'Physics & EE', 'Year 4 Senior', 'Evenings & Weekends', 'Peer Desk / Portal'),
('m3', 'u4', '["Biotechnology", "Chemistry"]'::jsonb, TRUE, 131, 'Lab mentor for PCR, gel electrophoresis and analytical chemistry practicals.', 'Usually replies in 8 hours', 'Biotechnology', 'Year 3 Mentor', 'Tue/Thu 4pm-6pm', 'BioLab 3 / Portal'),
('m4', 'u5', '["Computer Science"]'::jsonb, TRUE, 196, 'Mentors data structures, operating systems and systems programming in C.', 'Usually replies in 2 hours', 'Computer Science', 'Year 4 Senior', 'Daily 6pm-9pm', 'Turing Lab / Portal')
ON CONFLICT (id) DO NOTHING;

-- 3. Questions
INSERT INTO questions (id, author_id, title, description, subject, topic, tags, status, urgency, upvotes, views, answer_count, created_at) VALUES
('q1', 'u1', 'How does recursion work in C, and when does the stack overflow?', 'I understand the idea of a function calling itself, but I lose track of what happens in memory. How are stack frames created for each recursive call in C, and what exactly causes a segmentation fault for deep recursion like factorial(100000)?', 'Computer Science', 'Programming Fundamentals', '["C", "Recursion", "Memory"]'::jsonb, 'solved', 'normal', 64, 921, 3, NOW() - INTERVAL '26 hours'),
('q2', 'u6', 'How do I calculate the electric field of a point charge at a distance?', 'Our lecture derived E = kQ/r² but I am unsure how to apply it when multiple charges are involved. Do I add the fields as scalars or vectors, and how do I handle the direction in 2D problems?', 'Physics', 'Electrostatics', '["Electrostatics", "Coulomb Law", "Vectors"]'::jsonb, 'open', 'normal', 41, 540, 1, NOW() - INTERVAL '7 hours'),
('q3', 'u7', 'How does PCR amplify DNA in just a few hours?', 'I know PCR has denaturation, annealing and extension steps, but I don''t understand how the amount of DNA grows so fast and why we need a thermostable polymerase like Taq.', 'Biotechnology', 'Molecular Techniques', '["PCR", "DNA", "Taq Polymerase"]'::jsonb, 'solved', 'normal', 58, 777, 2, NOW() - INTERVAL '50 hours'),
('q4', 'u1', 'What is the difference between mitosis and meiosis?', 'Both are forms of cell division but I keep mixing up the chromosome numbers and the number of daughter cells. Is there an intuitive way to remember the differences for the exam?', 'Biology', 'Cell Division', '["Mitosis", "Meiosis", "Genetics"]'::jsonb, 'open', 'normal', 37, 612, 1, NOW() - INTERVAL '13 hours'),
('q5', 'u6', 'Why is the hybridisation of SF6 sp3d2 and not something simpler?', 'In inorganic chemistry we were told sulphur expands its octet. How do I predict hybridisation reliably from the steric number instead of memorising every molecule?', 'Chemistry', 'Chemical Bonding', '["Hybridisation", "VSEPR", "Bonding"]'::jsonb, 'open', 'normal', 22, 310, 0, NOW() - INTERVAL '4 hours'),
('q6', 'u7', 'How do I find the eigenvalues of a 3x3 matrix without heavy computation?', 'The characteristic polynomial gets messy. Are there shortcuts using the trace and determinant, and how do I check my answer quickly during a timed exam?', 'Mathematics', 'Linear Algebra', '["Linear Algebra", "Eigenvalues", "Matrices"]'::jsonb, 'open', 'normal', 29, 404, 0, NOW() - INTERVAL '2 hours'),
('q7', 'u1', 'When should I use a hash map instead of a balanced BST?', 'Both give fast lookups. In interviews and in DSA assignments, how do I justify the choice in terms of time complexity, ordering requirements and memory?', 'Computer Science', 'Data Structures', '["Data Structures", "Hashing", "Trees"]'::jsonb, 'open', 'normal', 48, 688, 1, NOW() - INTERVAL '31 hours'),
('q8', 'u6', 'Why does the Michaelis-Menten curve plateau at high substrate concentration?', 'I understand Vmax conceptually but not why adding more substrate stops helping. How does this relate to enzyme saturation and the meaning of Km?', 'Biology', 'Enzymology', '["Enzymes", "Kinetics", "Biochemistry"]'::jsonb, 'open', 'normal', 19, 240, 0, NOW() - INTERVAL '6 hours'),
('q9', 'u7', 'How do CRISPR-Cas9 guide RNAs avoid off-target edits?', 'Our biotech lab is designing gRNAs. What rules do we follow for specificity, and how do tools score off-target risk?', 'Biotechnology', 'Genome Editing', '["CRISPR", "Genome Editing", "gRNA"]'::jsonb, 'open', 'normal', 33, 388, 1, NOW() - INTERVAL '20 hours'),
('q10', 'u1', 'What exactly is the physical meaning of entropy in thermodynamics?', 'Textbooks say disorder, but that feels vague. How does the statistical definition S = k ln W connect with the classical dQ/T definition?', 'Physics', 'Thermodynamics', '["Thermodynamics", "Entropy", "Statistical Mechanics"]'::jsonb, 'solved', 'normal', 52, 701, 1, NOW() - INTERVAL '72 hours'),
('q11', 'u6', 'How do I decide between deadlock prevention and avoidance in an OS?', 'Banker''s algorithm looks expensive. In real operating systems which strategy is used and why do textbooks still teach avoidance?', 'Computer Science', 'Operating Systems', '["Operating Systems", "Deadlock", "Concurrency"]'::jsonb, 'open', 'normal', 26, 296, 0, NOW() - INTERVAL '9 hours'),
('q12', 'u7', 'Why is titration end point different from equivalence point?', 'In our volumetric analysis lab the indicator changes colour slightly after the calculated equivalence point. Is this error avoidable?', 'Chemistry', 'Analytical Chemistry', '["Titration", "Lab", "Analytical"]'::jsonb, 'open', 'normal', 15, 188, 1, NOW() - INTERVAL '15 hours')
ON CONFLICT (id) DO NOTHING;

-- 4. Answers
INSERT INTO answers (id, question_id, author_id, content, is_accepted, is_verified, answer_type, upvotes, created_at) VALUES
('a1', 'q1', 'u5', 'Each call to a function in C pushes a new stack frame holding its parameters, local variables and the return address. In recursion those frames stack up until a base case returns. factorial(100000) needs 100000 live frames at once; the thread stack (typically 1–8 MB) runs out and the OS raises a segmentation fault. Convert to an iterative loop, or rewrite in a tail-recursive form that the compiler can optimise with -O2.', TRUE, TRUE, 'ACCEPTED', 44, NOW() - INTERVAL '24 hours'),
('a2', 'q1', 'u3', 'A practical trick: print the depth as the first line of the function. Watching the depth grow and then unwind makes the call stack visible without a debugger.', FALSE, FALSE, 'PEER_ANSWER', 12, NOW() - INTERVAL '22 hours'),
('a3', 'q1', 'u6', 'Also remember that each frame''s size matters. A large local array inside the recursive function will overflow far sooner than a function with two int locals.', FALSE, FALSE, 'PEER_ANSWER', 8, NOW() - INTERVAL '20 hours'),
('a4', 'q3', 'u2', 'PCR is exponential: every cycle copies both strands, so after n cycles you have roughly 2^n copies of the target region. Thirty cycles give about a billion-fold amplification. Taq polymerase comes from Thermus aquaticus and survives the 94–96 °C denaturation step, so you don''t have to add fresh enzyme every cycle — that is what made automation possible.', TRUE, TRUE, 'FACULTY_VERIFIED', 51, NOW() - INTERVAL '48 hours'),
('a5', 'q3', 'u4', 'Practical lab note: annealing temperature is usually primer Tm minus 5 °C. If you get smeared bands, raise it by 2 °C steps before changing anything else.', FALSE, TRUE, 'PEER_ANSWER', 17, NOW() - INTERVAL '44 hours'),
('a6', 'q2', 'u3', 'Electric field is a vector, so you superpose the individual fields componentwise. For each charge compute magnitude kQ/r², resolve it into x and y using the geometry, sum the components, then recombine. Direction points away from a positive source charge and toward a negative one.', FALSE, FALSE, 'PEER_ANSWER', 23, NOW() - INTERVAL '5 hours'),
('a7', 'q4', 'u2', 'Mitosis: one division, two genetically identical diploid daughter cells, used for growth and repair. Meiosis: two divisions, four genetically distinct haploid gametes, with crossing over in prophase I. Memory hook — mitosis makes copies, meiosis makes variety.', FALSE, TRUE, 'FACULTY_ANSWER', 28, NOW() - INTERVAL '11 hours'),
('a8', 'q7', 'u5', 'Use a hash map when you only need key lookup in average O(1) and ordering is irrelevant. Use a balanced BST when you need sorted traversal, range queries or predecessor/successor in guaranteed O(log n). Hash maps also degrade with poor hash functions and use extra memory for load factor headroom.', FALSE, FALSE, 'PEER_ANSWER', 31, NOW() - INTERVAL '28 hours'),
('a9', 'q10', 'u3', 'Both definitions agree. S = k ln W counts microstates; dS = dQ/T measures heat spread at a temperature. For an ideal gas expanding isothermally both give the same ΔS = nR ln(V2/V1). Entropy is better described as ''energy dispersal among accessible states'' than as disorder.', TRUE, FALSE, 'ACCEPTED', 39, NOW() - INTERVAL '70 hours'),
('a10', 'q9', 'u4', 'Design a 20-nt protospacer directly upstream of an NGG PAM, keep GC content between 40–60%, and avoid homopolymer runs. Tools like CRISPOR score off-targets by mismatch count and position — mismatches in the seed region near the PAM matter most.', FALSE, FALSE, 'PEER_ANSWER', 14, NOW() - INTERVAL '18 hours'),
('a11', 'q12', 'u4', 'The equivalence point is a stoichiometric fact; the end point is what the indicator can show you. Choose an indicator whose transition range brackets the pH at equivalence and the gap becomes negligible.', FALSE, FALSE, 'PEER_ANSWER', 9, NOW() - INTERVAL '13 hours')
ON CONFLICT (id) DO NOTHING;

-- 5. Answer Replies
INSERT INTO answer_replies (id, answer_id, author_id, content, created_at) VALUES
('r1', 'a1', 'u1', 'The stack-frame picture finally made it click. Thank you!', NOW() - INTERVAL '23 hours')
ON CONFLICT (id) DO NOTHING;

-- 6. Notifications
INSERT INTO notifications (id, user_id, type, message, question_id, read, created_at) VALUES
('n1', 'u1', 'answer', 'Kabir Menon answered your question on recursion in C.', 'q1', FALSE, NOW() - INTERVAL '24 hours'),
('n2', 'u1', 'accepted', 'You marked an answer as accepted. The author earned +15 reputation.', 'q1', FALSE, NOW() - INTERVAL '23 hours'),
('n3', 'u1', 'upvote', 'Your question ''When should I use a hash map instead of a balanced BST?'' reached 48 upvotes.', 'q7', FALSE, NOW() - INTERVAL '12 hours'),
('n4', 'u1', 'mentor', 'Verified mentor Dr. Meera Raghavan responded in Biology.', 'q4', TRUE, NOW() - INTERVAL '11 hours'),
('n5', 'u1', 'similar', 'A similar question was found: ''How does PCR amplify DNA in just a few hours?''', 'q3', TRUE, NOW() - INTERVAL '40 hours')
ON CONFLICT (id) DO NOTHING;

-- 7. Reports
INSERT INTO reports (id, reporter_id, content_id, content_type, excerpt, reason, status, created_at) VALUES
('rep1', 'u6', 'q5', 'question', 'Why is the hybridisation of SF6 sp3d2 and not something simpler?', 'Duplicate of an existing question', 'pending', NOW() - INTERVAL '3 hours'),
('rep2', 'u1', 'a3', 'answer', 'Also remember that each frame''s size matters...', 'Low quality / incomplete answer', 'reviewing', NOW() - INTERVAL '10 hours'),
('rep3', 'u7', 'a6', 'answer', 'Electric field is a vector, so you superpose...', 'Suspected plagiarism from a textbook', 'pending', NOW() - INTERVAL '18 hours'),
('rep4', 'u6', 'q11', 'question', 'How do I decide between deadlock prevention and avoidance in an OS?', 'Off-topic for this institution portal', 'dismissed', NOW() - INTERVAL '30 hours')
ON CONFLICT (id) DO NOTHING;

-- 8. Saved Questions
INSERT INTO saved_questions (user_id, question_id) VALUES
('u1', 'q3'),
('u1', 'q10')
ON CONFLICT DO NOTHING;

-- 9. Campus Resources
INSERT INTO campus_resources (id, name, type, department, venue, description, contact_method, working_hours) VALUES
('res1', 'Academic Coordinator Office', 'Administrative', 'Academic Affairs', 'Admin Block, Room 204', 'Handles course registration, credit transfers, grade appeals and official degree petitions.', 'academic.coord@university.edu / Ext 210', 'Mon-Fri 9:00 AM - 5:00 PM'),
('res2', 'Department of Computer Science Office', 'Department Office', 'Computer Science', 'Alan Turing Building, 1st Floor', 'General department enquiries, course syllabus copies, faculty meeting requests and lab clearance.', 'cs.dept@university.edu / Ext 440', 'Mon-Fri 8:30 AM - 5:30 PM'),
('res3', 'Final Year Project Coordination Desk', 'Project Coordinator', 'Academic Affairs', 'Technology Tower, Room 310', 'Guidance for Capstone and Mini Project submissions, guide approvals, ethics clearance and rubric guides.', 'project.coordinator@university.edu', 'Mon, Wed, Fri 2:00 PM - 5:00 PM'),
('res4', 'Central Library & Digital Commons', 'Library', 'Library Services', 'Central Library Building', 'Physical book lending, IEEE/ACM digital access, quiet study zones and plagiarism check support (Turnitin).', 'library.help@university.edu', 'Mon-Sat 8:00 AM - 10:00 PM'),
('res5', 'High-Performance Computing Lab', 'Laboratory', 'Computer Science', 'Turing Block, Lab 4', 'GPU cluster access for machine learning projects, Linux account provisioning and cluster debugging.', 'hpclab@university.edu', 'Mon-Fri 9:00 AM - 7:00 PM'),
('res6', 'Biotechnology Research Practical Lab', 'Laboratory', 'Life Sciences', 'Bio-Science Complex, Lab 2', 'Wet lab equipment, PCR thermocyclers, gel documentation systems, bacterial culture hoods.', 'biotech.lab@university.edu', 'Mon-Fri 9:00 AM - 6:00 PM'),
('res7', 'Career & Placement Cell', 'Placement Cell', 'Student Affairs', 'Placement Center, Ground Floor', 'Resume reviews, internship NOC letters, campus drive schedules and alumni mentorship connects.', 'placement@university.edu', 'Mon-Fri 9:30 AM - 5:30 PM'),
('res8', 'Student Counseling & Peer Wellness', 'Support Services', 'Student Welfare', 'Health & Wellness Center', 'Confidential academic stress counseling, exam anxiety support and disability accommodations.', 'wellness@university.edu', 'Mon-Sat 9:00 AM - 6:00 PM')
ON CONFLICT (id) DO NOTHING;

-- 10. Tasks
INSERT INTO tasks (id, title, description, category, due_date) VALUES
('t1', 'Final Capstone Project Proposal Submission', 'Submission workflow for undergraduate final-year capstone project proposal and mentor sign-off.', 'Project Submission', NOW() + INTERVAL '14 days'),
('t2', 'Semester Lab Practical Exam Hall Clearance', 'Checklist for obtaining lab technician signatures and journal verification before practical exams.', 'Examination', NOW() + INTERVAL '21 days'),
('t3', 'Course Re-evaluation and Grade Review', 'Formal petition procedure for reviewing mid-semester or end-semester examination answer scripts.', 'Academic Affairs', NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 11. Task Steps
INSERT INTO task_steps (id, task_id, step_order, instruction, resource_id, required_role) VALUES
('ts1', 't1', 1, 'Download and fill the standardized Project Proposal Abstract template from the portal.', 'res3', 'student'),
('ts2', 't1', 2, 'Schedule a 15-minute review with your designated Faculty Mentor or Senior Peer Mentor for approval.', 'res3', 'mentor'),
('ts3', 't1', 3, 'Submit the signed proposal PDF to the Final Year Project Coordination Desk (Room 310).', 'res3', 'faculty'),
('ts4', 't1', 4, 'Verify that confirmation status has changed to Approved on your academic dashboard.', 'res1', 'student'),
('ts5', 't2', 1, 'Complete all pending lab experiment write-ups and graphs in the physical practical record.', 'res5', 'student'),
('ts6', 't2', 2, 'Obtain the Lab In-charge signature during regular lab working hours.', 'res5', 'faculty'),
('ts7', 't2', 3, 'Submit the signed record to the Department Office for hall-ticket clearance endorsement.', 'res2', 'student')
ON CONFLICT (id) DO NOTHING;

-- 12. Knowledge Base
INSERT INTO knowledge_base (id, title, content, subject, topic, tags, source_question_id, source_answer_id, verified_by, status) VALUES
('kb1', 'Recursion Call Stacks and Stack Overflow in C', 'Each recursive function call pushes a new stack frame holding its parameters, local variables and return pointer. Deep recursion without base cases or with large local variables exhausts available thread stack memory (typically 1–8MB), prompting the operating system to send a SIGSEGV segmentation fault. Remedy: Use tail recursion with compiler optimization or convert to an iterative loop with heap memory.', 'Computer Science', 'Programming Fundamentals', '["C", "Recursion", "Memory", "Call Stack"]'::jsonb, 'q1', 'a1', 'u5', 'VERIFIED_CAMPUS_ANSWER'),
('kb2', 'Polymerase Chain Reaction (PCR) Mechanism and Thermostability', 'PCR amplifies DNA exponentially through thermal cycles of denaturation (94–96°C), primer annealing (50–65°C), and extension (72°C). Every cycle doubles the target segment (2^n factor), producing approximately 1 billion copies after 30 cycles. Thermus aquaticus (Taq) polymerase is heat-stable and survives denaturation without denaturation, eliminating the need to add fresh enzyme each cycle.', 'Biotechnology', 'Molecular Techniques', '["PCR", "DNA", "Taq Polymerase"]'::jsonb, 'q3', 'a4', 'u2', 'VERIFIED_CAMPUS_ANSWER'),
('kb3', 'Academic Project Submission Guidelines at Northfield Institute', 'All capstone and mini-project proposals must be submitted through the Project Coordination Desk (Room 310) by the second Friday of the semester. Must include faculty guide counter-signature and Turnitin similarity index below 15%. Late submissions require approval from the Academic Coordinator Office.', 'Academic Affairs', 'Project Submission', '["Project", "Submission", "Guidelines", "Coordinator"]'::jsonb, NULL, NULL, 'u2', 'VERIFIED_CAMPUS_ANSWER'),
('kb4', 'Central Library Turnitin Plagiarism Check & Book Borrowing Policy', 'Undergraduate students may borrow up to 4 books for 14 days. Turnitin similarity verification is free at the Digital Commons desk on the 2nd floor of Central Library. Submit documents at least 24 hours prior to department deadlines.', 'Library Services', 'Library Policy', '["Library", "Plagiarism", "Turnitin", "Borrowing"]'::jsonb, NULL, NULL, 'u8', 'VERIFIED_CAMPUS_ANSWER')
ON CONFLICT (id) DO NOTHING;
