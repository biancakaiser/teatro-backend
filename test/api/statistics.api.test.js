module.exports = (apiRequest, expect) => {
	it("should get statistics", async () => {
		const response = await apiRequest("/v1/statistics/");
		expect(response.success).to.be.equal(true);
	});
};
