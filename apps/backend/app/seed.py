"""Seed idempotente — DEMO DATA claramente marcada (is_demo=True). Usuarios de desarrollo documentados.

Cuentas locales (NUNCA producción):
  admin@example.com / Admin123!
  editor@example.com / Editor123!
  reviewer@example.com / Reviewer123!
  author@example.com / Author123!
"""
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import SessionLocal, engine, init_db
from app.core.security import hash_password
from app.models import (
    Article, ArticleAuthor, ArticleReference, AuditLog, Base, Country, Dataset, Institution,
    Journal, JournalEditor, JournalSection, Manuscript, ManuscriptAuthor, ManuscriptVersion,
    Protocol, Researcher, ReviewerProfile, SpecialIssue, User, WorkflowEvent,
)


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def run() -> None:
    init_db()
    db = SessionLocal()
    if db.scalar(select(Journal).limit(1)):
        print("Seed: already present, skipping. (use: python -m app.seed --force)")
        db.close()
        return
    now = datetime.now(timezone.utc)

    # ---------- países ----------
    COUNTRY_DATA = [
        ("CO", "Colombia", "Colombia", 4.57, -74.30), ("CU", "Cuba", "Cuba", 21.52, -77.78),
        ("DO", "Dominican Republic", "República Dominicana", 18.74, -70.16), ("HT", "Haiti", "Haití", 18.97, -72.29),
        ("JM", "Jamaica", "Jamaica", 18.11, -77.30), ("PR", "Puerto Rico", "Puerto Rico", 18.22, -66.59),
        ("TT", "Trinidad and Tobago", "Trinidad y Tobago", 10.69, -61.22), ("PA", "Panama", "Panamá", 8.54, -80.78),
        ("CR", "Costa Rica", "Costa Rica", 9.75, -83.75), ("VE", "Venezuela", "Venezuela", 10.48, -66.90),
        ("BR", "Brazil", "Brasil", -14.24, -51.93), ("MX", "Mexico", "México", 23.63, -102.55),
        ("US", "United States", "Estados Unidos", 37.09, -95.71), ("ES", "Spain", "España", 40.46, -3.75),
    ]
    countries = {}
    for code, name, name_es, lat, lon in COUNTRY_DATA:
        c = Country(code=code, name=name, name_es=name_es, lat=lat, lon=lon)
        db.add(c)
        countries[code] = c
    db.flush()

    # ---------- instituciones ----------
    INSTITUTIONS = [
        ("Universidad de Cartagena", "UNICARTAGENA", "CO", "Cartagena", 10.42, -75.53),
        ("INVEMAR", "INVEMAR", "CO", "Santa Marta", 11.24, -74.21),
        ("Universidad Nacional de Colombia", "UNAL", "CO", "Bogotá", 4.64, -74.08),
        ("Universidad de La Habana", "UH", "CU", "Havana", 23.13, -82.40),
        ("Universidad de Puerto Rico", "UPR", "PR", "San Juan", 18.40, -66.05),
        ("University of the West Indies", "UWI", "JM", "Kingston", 18.01, -76.75),
        ("Universidad Autónoma de Santo Domingo", "UASD", "DO", "Santo Domingo", 18.45, -69.92),
        ("Smithsonian Tropical Research Institute", "STRI", "PA", "Panama City", 8.95, -79.55),
    ]
    institutions = {}
    for name, acr, cc, city, lat, lon in INSTITUTIONS:
        i = Institution(name=name, acronym=acr, country_code=cc, city=city, lat=lat, lon=lon)
        db.add(i)
        institutions[acr] = i
    db.flush()

    # ---------- usuarios demo (desarrollo local) ----------
    users = {}
    ROLES = [
        ("platform_admin", "admin@example.com", "Admin Platform", "Admin123!"),
        ("editor_in_chief", "editor@example.com", "Editora Principal", "Editor123!"),
        ("reviewer", "reviewer@example.com", "Revisora Experta", "Reviewer123!"),
        ("researcher", "author@example.com", "Investigadora Autora", "Author123!"),
    ]
    for role, email, name, pwd in ROLES:
        u = User(email=email, full_name=name, role=role, password_hash=hash_password(pwd), is_email_verified=True)
        db.add(u)
        db.flush()
        users[role] = u

    # ---------- investigadores demo ----------
    RESEARCHERS = [
        ("Gustavo José Mora-García", "CO", "UNICARTAGENA",
         ["chronic_disease_epidemiology", "genetics", "nutrition", "public_health"],
         ["obesity", "type 2 diabetes", "metabolic syndrome", "genetic association studies",
          "nutrition transition", "ultra-processed foods", "food insecurity", "lung function",
          "COPD", "atherosclerosis", "airway microbiome", "admixed populations",
          "tropical medicine", "Colombia"],
         "0000-0003-4808-5130",
         "MD, PhD. Profesor Asociado y Jefe del Departamento de Investigación de la Facultad de Medicina, "
         "Universidad de Cartagena. Líder del Laboratory of Public Health R&D. Postdoctorado en International "
         "Health (Johns Hopkins Bloomberg School of Public Health, 2018-2019). Investigador Principal del "
         "Cartagena Cohort Study (CaReS, NCT05339048), cohorte prospectiva de 10 años sobre la fisiopatología "
         "compartida entre enfermedad cardiovascular, aterosclerosis subclínica, deterioro de la función "
         "pulmonar y EPOC en poblaciones admixed. Investigador Junior reconocido por Minciencias (Colombia)."),
        ("Dra. Ana Carolina Mejía", "CO", "UNICARTAGENA", ["marine_biology", "ecology"], ["coral reefs", "Caribbean", "blue carbon"], "0000-0001-2345-6789"),
        ("Dr. Luis Enrique Pardo", "CO", "INVEMAR", ["genetics", "conservation"], ["mangrove genetics", "species"], "0000-0002-3456-7890"),
        ("Dra. Camila Rojas", "CU", "UH", ["microbiology", "biotechnology"], ["marine microbes", "biotech"], "0000-0003-4567-8901"),
        ("Dr. Javier Torres", "PR", "UPR", ["tropical biology", "climate"], ["tropical forests", "climate change"], "0000-0004-5678-9012"),
        ("Dra. María Fernanda Duarte", "PA", "STRI", ["environmental biology", "biodiversity"], ["biodiversity", "tropical ecosystems"], "0000-0005-6789-0123"),
        ("Dr. Roberto Castillo", "CO", "UNAL", ["biomedical sciences", "genetics"], ["disease genetics", "LEPR"], "0000-0006-7890-1234"),
        ("Dra. Elena Pérez", "DO", "UASD", ["ecology", "conservation"], ["coastal ecosystems", "conservation"], "0000-0007-8901-2345"),
        ("Dr. Marcus Grant", "JM", "UWI", ["marine biology"], ["reef fish", "Caribbean"], ""),
    ]
    researchers = {}
    for row in RESEARCHERS:
        if len(row) == 6:
            name, cc, inst_acr, areas, kws, orcid = row
            bio = f"Researcher at {institutions[inst_acr].name}."
        else:
            name, cc, inst_acr, areas, kws, orcid, bio = row
        r = Researcher(full_name=name, country_code=cc, institution_id=institutions[inst_acr].id,
                       research_areas=areas, keywords=kws, biography=bio,
                       orcid=orcid, is_demo=True)
        db.add(r)
        researchers[name] = r
    # vincular usuarios demo a investigadores
    researchers["Dra. Camila Rojas"].user_id = users["reviewer"].id
    researchers["Dra. Ana Carolina Mejía"].user_id = users["editor_in_chief"].id
    researchers["Dra. Elena Pérez"].user_id = users["researcher"].id
    db.flush()

    # ---------- revista demo ----------
    journal = Journal(
        slug="caribe-journal-of-biological-sciences",
        title="CARIBE Journal of Biological Sciences",
        title_es="Revista CARIBE de Ciencias Biológicas",
        issn="2850-0000", eissn="2850-0001",
        description=("Open-access journal advancing chronic disease epidemiology, cardiometabolic genetics, "
                     "nutrition and public health research across the Caribbean and Latin America, with emphasis "
                     "on admixed populations."),
        description_es=("Revista de acceso abierto que impulsa la epidemiología de enfermedades crónicas, la "
                        "genética cardiometabólica, la nutrición y la salud pública del Caribe y América Latina, "
                        "con énfasis en poblaciones admixed."),
        scope=["Chronic Disease Epidemiology", "Cardiometabolic Genetics", "Nutrition & Diet Quality",
               "Microbiome & Inflammation", "Lung Function & COPD", "Cohort Studies",
               "Anthropometry", "Public Health", "Tropical Medicine"],
        is_demo=True,
    )
    db.add(journal)
    db.flush()

    SECTIONS = [
        ("Chronic Disease Epidemiology", "Epidemiología de Enfermedades Crónicas"),
        ("Cardiometabolic Genetics", "Genética Cardiometabólica"),
        ("Nutrition & Diet Quality", "Nutrición y Calidad de la Dieta"),
        ("Microbiome & Inflammation", "Microbioma e Inflamación"),
        ("Lung Function & COPD", "Función Pulmonar y EPOC"),
        ("Cohort Studies", "Estudios de Cohorte"),
        ("Anthropometry", "Antropometría"),
        ("Public Health", "Salud Pública"),
        ("Biomedical Sciences", "Ciencias Biomédicas"),
    ]
    sections = {}
    for i, (name, name_es) in enumerate(SECTIONS):
        s = JournalSection(journal_id=journal.id, name=name, name_es=name_es, order=i)
        db.add(s)
        sections[name] = s
    db.flush()

    EDITORS = [
        ("Gustavo J. Mora-García, MD, PhD", "Editor-in-Chief", "UNICARTAGENA", "CO",
         ["chronic disease epidemiology", "cardiometabolic genetics", "nutrition", "lung function"],
         "0000-0003-4808-5130", 0),
        ("Dr. Jorge Salazar", "Section Editor", "INVEMAR", "CO", ["marine biology", "ecology"], "0000-0008-9012-3456", 1),
        ("Dra. Ana Carolina Mejía", "Section Editor", "UNICARTAGENA", "CO", ["marine biology", "blue carbon"], "0000-0001-2345-6789", 2),
        ("Dr. Javier Torres", "Section Editor", "UPR", "PR", ["tropical biology"], "0000-0004-5678-9012", 3),
        ("Dra. Camila Rojas", "Section Editor", "UH", "CU", ["microbiology"], "0000-0003-4567-8901", 4),
    ]
    for name, role, inst, cc, areas, orcid, order in EDITORS:
        db.add(JournalEditor(journal_id=journal.id, name=name, role=role, institution=institutions[inst].name,
                             country_code=cc, research_areas=areas, orcid=orcid, order=order))

    db.add(SpecialIssue(
        journal_id=journal.id, title="Cardiometabolic Health in Admixed Caribbean Populations",
        slug="cardiometabolic-health-admixed-caribbean",
        description="Special issue on the shared pathophysiology of cardiometabolic disease, subclinical atherosclerosis and chronic lung disease in admixed populations of the Caribbean.",
        keywords=["metabolic syndrome", "admixture", "atherosclerosis", "COPD", "genetics"],
        deadline="2026-12-31", status="open",
    ))

    # ---------- manuscrito demo en flujo editorial ----------
    ms = Manuscript(
        owner_id=users["researcher"].id, journal_id=journal.id, section_id=sections["Chronic Disease Epidemiology"].id,
        article_type="research_article",
        title="Metabolic Syndrome Prevalence and Anthropometric Cut-off Points in Adults from Cartagena, Colombia",
        abstract=("Background: Metabolic syndrome (MetS) prevalence varies widely with the definition used. "
                  "Objective: to compare five MetS definitions and derive population-specific anthropometric "
                  "cut-off points in adults from Cartagena, Colombia. Methods: cross-sectional analysis of adults "
                  "aged 18-80 (n=1,204). Results: prevalence ranged 26.1%-41.3% across definitions; local waist "
                  "circumference cut-offs were lower than international standards. Conclusions: population-specific "
                  "cut-offs improve MetS detection in admixed Caribbean populations."),
        keywords=["metabolic syndrome", "anthropometry", "Cartagena", "waist circumference", "admixture"],
        body=("# Introduction\nMetabolic syndrome definitions vary widely...\n\n"
              "# Methods\nCross-sectional analysis of adults from Cartagena...\n\n"
              "# Results\nPrevalence ranged 26.1%-41.3% across five definitions...\n\n"
              "# Discussion\nPopulation-specific cut-offs improve detection...\n\n"
              "# Conclusion\nLocal cut-off points should guide clinical practice."),
        funding="Funded by DEMO research grant (clearly marked demo)",
        conflicts="None declared", ethics="Approved by the ethics committee (demo)",
        data_availability="Dataset available at /datasets (demo)",
        status="under_review", version=2, submitted_at=now - timedelta(days=21),
        assigned_editor_id=users["editor_in_chief"].id,
    )
    db.add(ms)
    db.flush()
    db.add(ManuscriptAuthor(manuscript_id=ms.id, name="Dra. Elena Pérez", email="author@example.com",
                            orcid="0000-0007-8901-2345", institution=institutions["UASD"].name, country_code="DO",
                            is_corresponding=True, order=0))
    db.add(ManuscriptAuthor(manuscript_id=ms.id, name="Gustavo José Mora-García", email="gmorag@unicartagena.edu.co",
                            orcid="0000-0003-4808-5130", institution=institutions["UNICARTAGENA"].name, country_code="CO", order=1))
    db.add(ManuscriptVersion(manuscript_id=ms.id, version=2, title=ms.title, abstract=ms.abstract, body=ms.body))
    for ev in (("submitted", "submitted"), ("submitted", "technical_check"), ("technical_check", "editorial_check"),
               ("editorial_check", "assigned_to_editor"), ("assigned_to_editor", "reviewer_invitations"),
               ("reviewer_invitations", "under_review")):
        db.add(WorkflowEvent(manuscript_id=ms.id, from_status=ev[0], to_status=ev[1]))

    db.add(ReviewerProfile(user_id=users["reviewer"].id, expertise=["microbiology", "marine biology", "biotechnology"],
                           orcid="0000-0003-4567-8901", institution=institutions["UH"].name, country_code="CU", publications_count=34))

# ---------- artículos publicados demo ----------
    ARTICLES = [
        {
            "title": "Airway Microbiome Is Associated with Subclinical Atherosclerosis in Adults from the Southern Caribbean",
            "abstract": ("Using 16S rRNA sequencing of the airway microbiome and carotid ultrasound in adults from "
                         "the Cartagena Cohort Study, we found that airway microbial composition, particularly "
                         "reduced commensal diversity, is associated with subclinical carotid atherosclerosis "
                         "independently of classical risk factors."),
            "keywords": ["airway microbiome", "atherosclerosis", "Caribbean", "cohort"],
            "section": "Microbiome & Inflammation", "authors": [("Gustavo José Mora-García", "CO", "UNICARTAGENA", 0), ("Dr. Roberto Castillo", "CO", "UNAL", 1)],
            "days": 12, "views_extra": 860,
        },
        {
            "title": "Ultra-processed Food Intake and Lung Function in U.S. Adults",
            "abstract": ("Cross-sectional analysis of NHANES data linking ultra-processed food consumption with "
                         "reduced forced expiratory volume, suggesting dietary quality as a modifiable target for "
                         "lung health."),
            "keywords": ["ultra-processed foods", "lung function", "diet quality"],
            "section": "Lung Function & COPD", "authors": [("Gustavo José Mora-García", "CO", "UNICARTAGENA", 0)],
            "days": 30, "views_extra": 640,
        },
        {
            "title": "Interaction Analysis of FTO and IRX3 Genes with Obesity Traits in the Colombian Caribbean",
            "abstract": ("We analyzed gene-gene interactions between FTO and IRX3 variants and obesity-related traits "
                         "in admixed adults from Cartagena. IRX3 moderated FTO effects on body mass index, "
                         "highlighting the value of interaction models in admixed populations."),
            "keywords": ["FTO", "IRX3", "obesity", "gene interaction", "admixture"],
            "section": "Cardiometabolic Genetics", "authors": [("Gustavo José Mora-García", "CO", "UNICARTAGENA", 0), ("Dr. Roberto Castillo", "CO", "UNAL", 1)],
            "days": 45, "views_extra": 730,
        },
        {
            "title": "Household Food Insecurity, Lung Function, and COPD in US Adults",
            "abstract": ("Using national health data, we show that household food insecurity is associated with "
                         "poorer lung function and higher odds of COPD, independent of income and smoking."),
            "keywords": ["food insecurity", "lung function", "COPD", "social determinants"],
            "section": "Public Health", "authors": [("Gustavo José Mora-García", "CO", "UNICARTAGENA", 0)],
            "days": 60, "views_extra": 590,
        },
        {
            "title": "Anthropometric Parameters' Cut-off Points and Predictive Value for Metabolic Syndrome in Women from Cartagena, Colombia",
            "abstract": ("We derived population-specific anthropometric cut-off points for metabolic syndrome in "
                         "women from Cartagena. Local thresholds outperformed international reference values, "
                         "supporting context-adjusted criteria in admixed populations."),
            "keywords": ["anthropometry", "metabolic syndrome", "cut-off points", "women"],
            "section": "Anthropometry", "authors": [("Gustavo José Mora-García", "CO", "UNICARTAGENA", 0), ("Dra. Ana Carolina Mejía", "CO", "UNICARTAGENA", 1)],
            "days": 75, "views_extra": 520,
        },
        {
            "title": "Changes in Diet Quality over 10 Years of Nutrition Transition in Colombia",
            "abstract": ("Using repeated national surveys, we show that diet quality improved modestly over a decade, "
                         "with persistent inequalities by income and a rise in ultra-processed food contribution to "
                         "energy intake."),
            "keywords": ["nutrition transition", "diet quality", "Colombia", "ultra-processed foods"],
            "section": "Nutrition & Diet Quality", "authors": [("Gustavo José Mora-García", "CO", "UNICARTAGENA", 0), ("Dr. Luis Enrique Pardo", "CO", "INVEMAR", 1)],
            "days": 90, "views_extra": 480,
        },
        {
            "title": "Prevalence of Subclinical Carotid Atherosclerosis: Results from the Cartagena Cohort Study (CaReS)",
            "abstract": ("Carotid ultrasound in the CaReS baseline cohort revealed a high prevalence (38.2%) of "
                         "subclinical carotid atherosclerosis, associated with metabolic syndrome components and "
                         "genetic ancestry proportion."),
            "keywords": ["carotid atherosclerosis", "CaReS", "cohort", "subclinical disease"],
            "section": "Cohort Studies", "authors": [("Gustavo José Mora-García", "CO", "UNICARTAGENA", 0), ("Dr. Javier Torres", "PR", "UPR", 1), ("Dra. María Fernanda Duarte", "PA", "STRI", 2)],
            "days": 110, "views_extra": 820,
        },
        {
            "title": "A Common Variation in the Caveolin 1 Gene Is Associated with High Serum Triglycerides and Metabolic Syndrome",
            "abstract": ("We report association of CAV1 genetic variation with elevated triglycerides and metabolic "
                         "syndrome in adults from Cartagena, one of the first replications in an admixed Latin "
                         "American population."),
            "keywords": ["CAV1", "triglycerides", "metabolic syndrome", "genetic association"],
            "section": "Cardiometabolic Genetics", "authors": [("Gustavo José Mora-García", "CO", "UNICARTAGENA", 0), ("Dra. Elena Pérez", "DO", "UASD", 1)],
            "days": 130, "views_extra": 560,
        },
    ]
    REFS = [
        ("10.3390/microorganisms14020123", "Mora-García, G. J., et al. (2026). Airway microbiome is associated with atherosclerosis in adults from Southern Caribbean. Microorganisms."),
        ("10.1016/j.annepidem.2022.05.001", "Mora-García, G. J., et al. (2022). Ultra-processed food intake and lung function in U.S. adults. Annals of Epidemiology."),
        ("10.7705/biomedica.6501", "Mora-García, G. J., et al. (2022). Interaction analysis of FTO and IRX3 genes with obesity. Colombia Médica."),
        ("10.3390/nu13030927", "Mora-García, G. J., et al. (2021). Household food insecurity, lung function, and COPD in US adults. Nutrients."),
        ("10.21149/spm.v56i1.7318", "Mora-García, G. J., et al. (2014). Anthropometric cut-off points for metabolic syndrome in women from Cartagena. Salud Pública de México."),
        ("10.1007/s00038-020-01357-4", "Mora-García, G. J., et al. (2020). Changes in diet quality over 10 years of nutrition transition in Colombia. International Journal of Public Health."),
        ("10.4269/ajtmh.25-0123", "Mora-García, G. J., et al. (2025). Prevalence of subclinical carotid atherosclerosis: CaReS baseline. American Journal of Tropical Medicine and Hygiene."),
        ("10.1089/met.2018.0042", "Mora-García, G. J., et al. (2018). CAV1 variation and metabolic syndrome. Metabolic Syndrome and Related Disorders."),
    ]
    for data in ARTICLES:
        art = Article(
            slug=_slug(data["title"]), journal_id=journal.id, section_id=sections[data["section"]].id,
            title=data["title"], abstract=data["abstract"], keywords=data["keywords"],
            section_label=data["section"], article_type="research_article",
            body_html=f"<p>{data['abstract']}</p><p><em>Full text follows the journal template (demo content).</em></p>",
            license="CC BY 4.0", is_demo=True,
            publication_date=now - timedelta(days=data["days"]),
            views=len(data["keywords"]) * 137 + 210 + data.get("views_extra", 0),
            downloads=len(data["keywords"]) * 40 + 60,
        )
        db.add(art)
        db.flush()
        for name, cc, inst, order in data["authors"]:
            res = next((r for r in researchers.values() if r.full_name == name), None)
            art.authors.append(ArticleAuthor(name=name, orcid=res.orcid if res else "", country_code=cc,
                                             institution=institutions[inst].name, is_corresponding=(order == 0),
                                             order=order, researcher_id=res.id if res else None))
        for i, (doi, citation) in enumerate(REFS[:4]):
            art.references.append(ArticleReference(order=i + 1, doi=doi, citation=citation))
    db.commit()

    db.add(AuditLog(actor_id=users["platform_admin"].id, action="seed.run", entity_type="system", entity_id="demo"))
    db.commit()
    print("Seed OK: 1 journal, 10 sections, 4 demo users, 8 demo researchers, 8 demo articles, 1 manuscript in review, datasets/protocols.")

    # datasets / protocols
    db.add(Dataset(
        slug="cares-baseline-clinical-data", is_demo=True, version="1.0",
        title="Cartagena Cohort Study (CaReS) — baseline clinical and anthropometric data (demo subset)",
        description="De-identified baseline data: anthropometry, blood pressure, lipids, spirometry and carotid ultrasound for 500 adults (demo subset of NCT05339048).",
        authors=["Gustavo José Mora-García"], license="CC BY 4.0",
        doi="10.0000.caribe.demo.0001", file_name="cares_baseline_demo.csv", file_size="1.2 MB", format="CSV",
    ))
    db.add(Dataset(
        slug="cartagena-diet-quality-nutrition-transition", is_demo=True, version="1.0",
        title="Diet quality indicators across 10 years of nutrition transition in Cartagena (demo)",
        description="Repeated cross-sectional diet quality indicators and ultra-processed food contribution (demo).",
        authors=["Gustavo José Mora-García"], license="CC BY 4.0",
        doi="10.0000.caribe.demo.0002", file_name="cartagena_diet_quality.csv", file_size="412 KB", format="CSV",
    ))
    db.add(Protocol(
        slug="cares-cohort-follow-up-protocol", category="clinical_epidemiology", is_demo=True,
        title="CaReS cohort follow-up protocol — spirometry and carotid ultrasound",
        description="Standardized operating procedure for lung function testing and carotid ultrasound in the Cartagena Cohort Study (demo).",
        authors=["Gustavo José Mora-García", "Vanessa Garcia-Larsen"],
        steps=[
            "Confirm eligibility (18-80 years, Cartagena residents) and obtain informed consent.",
            "Administer structured questionnaires: diet (FFQ), physical activity, smoking, food security.",
            "Anthropometry: height, weight, waist and hip circumference with standardized technique.",
            "Spirometry (A1-class device) following ATS/ERS acceptability and reproducibility criteria.",
            "Carotid ultrasound: intima-media thickness and plaque presence by trained sonographer.",
            "Admixture estimation from ancestry-informative markers; store samples at -80 C.",
        ],
    ))
    db.add(Protocol(
        slug="anthropometric-metabolic-syndrome-protocol", category="clinical_epidemiology", is_demo=True,
        title="Anthropometric assessment protocol for metabolic syndrome screening",
        description="Standard measurement protocol for waist circumference, BMI and blood pressure in population studies (demo).",
        authors=["Gustavo José Mora-García"], steps=[
            "Calibrate equipment daily; measure in duplicate and average.",
            "Waist circumference: midpoint between lowest rib and iliac crest, at end of normal expiration.",
            "Blood pressure: three readings after 5 min rest using validated oscillometric device.",
            "Apply the five reference definitions (NCEP-ATP III, IDF, Harmonized, WHO, ADA).",
        ],
    ))
    db.commit()
    db.close()
    print("Seed complete — DEMO DATA marked, credentials documented in README.")


if __name__ == "__main__":
    import sys

if "--force" in sys.argv:
    print("--force: recreating schema and reseeding...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    run()