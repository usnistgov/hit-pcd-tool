package gov.nist.hit.gvt.test;

import static org.junit.Assert.assertNotNull;

import org.junit.Ignore;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import gov.nist.hit.core.domain.TestPlan;
import gov.nist.hit.core.domain.TestStep;
import gov.nist.hit.core.service.TestPlanService;
import gov.nist.hit.core.service.TestStepService;


//@RunWith(SpringJUnit4ClassRunner.class)
//@WebAppConfiguration
//@ContextConfiguration(classes = {GVTWebBeanConfig.class,GVTBootstrap.class})
@Ignore
public class ServicesTest {
	
	@Autowired
	private TestStepService testStepService;

	@Autowired
	private TestPlanService testPlanService;

		
	@Test
	  public void testSendIGAMTZipToLocal() {
//		
//		TestStep ts = testStepService.findOne(new Long(25971));
//		
//		if (ts != null) {
//			TestPlan tp = testPlanService.findTestPlanContainingTestStep(null, ts);
//			assertNotNull(tp);
//			System.out.println(tp.getName());
//		}
//		
	    
		
	  }
	
	
}
